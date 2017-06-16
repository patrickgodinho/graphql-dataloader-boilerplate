// @flow
import DataLoader from 'dataloader';
import { User as UserModel } from '../model';
import connectionFromMongoCursor from './ConnectionFromMongoCursor';
import mongooseLoader from './mongooseLoader';

type UserType = {
  id: string,
  _id: string,
  name: string,
  email: string,
  active: boolean,
}

export default class User {
  id: string;
  _id: string;
  name: string;
  email: string;
  active: boolean;

  constructor(data: UserType, viewer) {
    this.id = data.id;
    this._id = data._id;
    this.name = data.name;

    // you can only see your own email, and your active status
    if (viewer && viewer._id.equals(data._id)) {
      this.email = data.email;
      this.active = data.active;
    }
  }
}

export const getLoader = () => new DataLoader(ids => mongooseLoader(UserModel, ids));

const viewerCanSee = (viewer, data) => {
  // Anyone can se another user
  return true;
};

export const load = async ({ user: viewer, dataloaders }, id) => {
  if (!id) return null;

  const data = await dataloaders.UserLoader.load(id);

  if (!data) return null;

  return viewerCanSee(viewer, data) ? new User(data, viewer) : null;
};

export const clearCache = ({ dataloaders }, id) => {
  return dataloaders.UserLoader.clear(id.toString());
};

export const loadUsers = async (context, args) => {
  const where = args.search ? { name: { $regex: new RegExp(`^${args.search}`, 'ig') } } : {};
  const users = UserModel
    .find(where, { _id: 1 })
    .sort({ createdAt: -1 });

  return connectionFromMongoCursor({
    cursor: users,
    context,
    args,
    loader: load,
  });
};
