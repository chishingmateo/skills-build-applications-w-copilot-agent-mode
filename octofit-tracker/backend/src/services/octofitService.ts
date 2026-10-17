import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    const error = new Error('Activity payload is required');
    Object.assign(error, { status: 400 });
    throw error;
  }

  const payload = input as {
    userId?: string;
    teamId?: string;
    type?: string;
    minutes?: number | string;
  };

  const userId = payload.userId?.trim();
  const teamId = payload.teamId?.trim();
  const type = payload.type?.trim();
  const minutes = Number(payload.minutes);

  if (!userId || !teamId || !type || Number.isNaN(minutes) || minutes <= 0) {
    const error = new Error('Valid userId, teamId, type, and minutes are required');
    Object.assign(error, { status: 400 });
    throw error;
  }

  if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(teamId)) {
    const error = new Error('userId and teamId must be valid Mongo ObjectIds');
    Object.assign(error, { status: 400 });
    throw error;
  }

  const [userExists, teamExists] = await Promise.all([
    User.findById(userId).lean(),
    Team.findById(teamId).lean(),
  ]);

  if (!userExists || !teamExists) {
    const error = new Error('Activity must reference an existing user and team');
    Object.assign(error, { status: 400 });
    throw error;
  }

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    const error = new Error('Team payload is required');
    Object.assign(error, { status: 400 });
    throw error;
  }

  const payload = input as {
    name?: string;
    mascot?: string;
    members?: Array<string | Types.ObjectId>;
  };

  const name = payload.name?.trim();
  const mascot = payload.mascot?.trim();
  const members = Array.isArray(payload.members) ? payload.members : [];

  if (!name || !mascot) {
    const error = new Error('Team name and mascot are required');
    Object.assign(error, { status: 400 });
    throw error;
  }

  const normalizedMembers = members.map((member) => {
    const memberId = String(member);
    if (!Types.ObjectId.isValid(memberId)) {
      const error = new Error('Team members must be valid Mongo ObjectIds');
      Object.assign(error, { status: 400 });
      throw error;
    }
    return new Types.ObjectId(memberId);
  });

  const team = await Team.create({ name, mascot, members: normalizedMembers });
  return team.toObject();
}

export async function getLeaderboard() {
  const leaderboard = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $lookup: { from: 'teams', localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $project: { _id: 0, teamId: '$_id', teamName: '$team.name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return leaderboard.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const email = userEmail.trim().toLowerCase();
  const user = await User.findOne({ email }).lean();

  if (!user) {
    const error = new Error('User not found');
    Object.assign(error, { status: 404 });
    throw error;
  }

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const preferredFocus = (user.fitnessGoal as string | undefined)?.trim() ||
    (recentActivity?.type ? recentActivity.type.toLowerCase() : 'endurance');

  const workouts = await Workout.find({ focus: preferredFocus }).lean();
  const fallbackWorkouts = await Workout.find().lean();
  const suggestions = (workouts.length ? workouts : fallbackWorkouts)
    .map((workout) => {
      const label = workout.focus || preferredFocus;
      const reason = recentActivity && recentActivity.type
        ? `Based on your recent ${recentActivity.type} activity, this ${label} workout matches your current pattern.`
        : `This ${label} workout supports your fitness goal and recent activity.`;

      return {
        ...workout,
        reason,
      };
    })
    .sort((left, right) => (left.focus === preferredFocus ? -1 : 1) - (right.focus === preferredFocus ? -1 : 1));

  return suggestions;
}

export { User };
