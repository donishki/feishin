import { jfNormalize } from '/@/renderer/api/jellyfin.api';
import type { JFAlbum, JFMusicFolderList, JFSong } from '/@/renderer/api/jellyfin.types';
import { ndNormalize } from '/@/renderer/api/navidrome.api';
import type { NDAlbum, NDSong } from '/@/renderer/api/navidrome.types';
import { SSMusicFolderList } from '/@/renderer/api/subsonic.types';
import type {
  RawAlbumListResponse,
  RawMusicFolderListResponse,
  RawSongListResponse,
} from '/@/renderer/api/types';
import { ServerListItem } from '/@/renderer/types';

const albumList = (data: RawAlbumListResponse | undefined, server: ServerListItem | null) => {
  let albums;
  switch (server?.type) {
    case 'jellyfin':
      albums = data?.items.map((item) => jfNormalize.album(item as JFAlbum, server));
      break;
    case 'navidrome':
      albums = data?.items.map((item) => ndNormalize.album(item as NDAlbum, server));
      break;
    case 'subsonic':
      break;
  }

  return {
    items: albums,
    startIndex: data?.startIndex,
    totalRecordCount: data?.totalRecordCount,
  };
};

const songList = (data: RawSongListResponse | undefined, server: ServerListItem | null) => {
  let songs;
  switch (server?.type) {
    case 'jellyfin':
      songs = data?.items.map((item) => jfNormalize.song(item as JFSong, server, ''));
      break;
    case 'navidrome':
      songs = data?.items.map((item) => ndNormalize.song(item as NDSong, server, ''));
      break;
    case 'subsonic':
      break;
  }

  return {
    items: songs,
    startIndex: data?.startIndex,
    totalRecordCount: data?.totalRecordCount,
  };
};

const musicFolderList = (
  data: RawMusicFolderListResponse | undefined,
  server: ServerListItem | null,
) => {
  let musicFolders;
  switch (server?.type) {
    case 'jellyfin':
      musicFolders = (data as JFMusicFolderList)?.map((item) => ({
        id: String(item.Id),
        name: item.Name,
      }));
      break;
    case 'navidrome':
      musicFolders = (data as SSMusicFolderList)?.map((item) => ({
        id: String(item.id),
        name: item.name,
      }));
      break;
    case 'subsonic':
      musicFolders = (data as SSMusicFolderList)?.map((item) => ({
        id: String(item.id),
        name: item.name,
      }));
      break;
  }

  return musicFolders;
};

export const normalize = {
  albumList,
  musicFolderList,
  songList,
};
