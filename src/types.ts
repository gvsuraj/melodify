export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  duration: number;
  dropboxLink: string;
  genre: string;
  createdAt: Date;
}

export interface Playlist {
  id: string;
  name: string;
  userId: string;
  songIds: string[];
  coverUrl: string;
  createdAt: Date;
}

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
}
