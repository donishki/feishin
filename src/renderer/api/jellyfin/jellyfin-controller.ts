import {
  AuthenticationResponse,
  MusicFolderListArgs,
  MusicFolderListResponse,
  GenreListArgs,
  AlbumArtistDetailArgs,
  AlbumArtistListArgs,
  albumArtistListSortMap,
  sortOrderMap,
  ArtistListArgs,
  artistListSortMap,
  AlbumDetailArgs,
  AlbumListArgs,
  albumListSortMap,
  TopSongListArgs,
  SongListArgs,
  songListSortMap,
  AddToPlaylistArgs,
  RemoveFromPlaylistArgs,
  PlaylistDetailArgs,
  PlaylistSongListArgs,
  PlaylistListArgs,
  playlistListSortMap,
  CreatePlaylistArgs,
  CreatePlaylistResponse,
  UpdatePlaylistArgs,
  UpdatePlaylistResponse,
  DeletePlaylistArgs,
  FavoriteArgs,
  FavoriteResponse,
  ScrobbleArgs,
  ScrobbleResponse,
  GenreListResponse,
  AlbumArtistDetailResponse,
  AlbumArtistListResponse,
  AlbumDetailResponse,
  AlbumListResponse,
  SongListResponse,
  AddToPlaylistResponse,
  RemoveFromPlaylistResponse,
  PlaylistDetailResponse,
  PlaylistListResponse,
} from '/@/renderer/api/types';
import { jfApiClient } from '/@/renderer/api/jellyfin/jellyfin-api';
import { jfNormalize } from './jellyfin-normalize';
import { jfType } from '/@/renderer/api/jellyfin/jellyfin-types';
import packageJson from '../../../../package.json';

const formatCommaDelimitedString = (value: string[]) => {
  return value.join(',');
};

const authenticate = async (
  url: string,
  body: {
    password: string;
    username: string;
  },
): Promise<AuthenticationResponse> => {
  const cleanServerUrl = url.replace(/\/$/, '');

  const res = await jfApiClient({ server: null, url: cleanServerUrl }).authenticate({
    body: {
      Pw: body.password,
      Username: body.username,
    },
    headers: {
      'X-Emby-Authorization': `MediaBrowser Client="Feishin", Device="PC", DeviceId="Feishin", Version="${packageJson.version}"`,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to authenticate');
  }

  return {
    credential: res.body.AccessToken,
    userId: res.body.User.Id,
    username: res.body.User.Name,
  };
};

const getMusicFolderList = async (args: MusicFolderListArgs): Promise<MusicFolderListResponse> => {
  const { apiClientProps } = args;
  const userId = apiClientProps.server?.userId;

  if (!userId) throw new Error('No userId found');

  const res = await jfApiClient(apiClientProps).getMusicFolderList({
    params: {
      userId,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to get genre list');
  }

  const musicFolders = res.body.Items.filter(
    (folder) => folder.CollectionType === jfType._enum.collection.MUSIC,
  );

  return {
    items: musicFolders.map(jfNormalize.musicFolder),
    startIndex: 0,
    totalRecordCount: musicFolders?.length || 0,
  };
};

const getGenreList = async (args: GenreListArgs): Promise<GenreListResponse> => {
  const { apiClientProps } = args;

  const res = await jfApiClient(apiClientProps).getGenreList();

  if (res.status !== 200) {
    throw new Error('Failed to get genre list');
  }

  return {
    items: res.body.Items.map(jfNormalize.genre),
    startIndex: 0,
    totalRecordCount: res.body?.Items?.length || 0,
  };
};

const getAlbumArtistDetail = async (
  args: AlbumArtistDetailArgs,
): Promise<AlbumArtistDetailResponse> => {
  const { query, apiClientProps } = args;

  if (!apiClientProps.server?.userId) {
    throw new Error('No userId found');
  }

  const res = await jfApiClient(apiClientProps).getAlbumArtistDetail({
    params: {
      id: query.id,
      userId: apiClientProps.server?.userId,
    },
    query: {
      Fields: 'Genres, Overview',
    },
  });

  const similarArtistsRes = await jfApiClient(apiClientProps).getSimilarArtistList({
    params: {
      id: query.id,
    },
    query: {
      Limit: 10,
    },
  });

  if (res.status !== 200 || similarArtistsRes.status !== 200) {
    throw new Error('Failed to get album artist detail');
  }

  return jfNormalize.albumArtist(
    { ...res.body, similarArtists: similarArtistsRes.body },
    apiClientProps.server,
  );
};

const getAlbumArtistList = async (args: AlbumArtistListArgs): Promise<AlbumArtistListResponse> => {
  const { query, apiClientProps } = args;

  const res = await jfApiClient(apiClientProps).getAlbumArtistList({
    query: {
      Fields: 'Genres, DateCreated, ExternalUrls, Overview',
      ImageTypeLimit: 1,
      Limit: query.limit,
      ParentId: query.musicFolderId,
      Recursive: true,
      SearchTerm: query.searchTerm,
      SortBy: albumArtistListSortMap.jellyfin[query.sortBy] || 'Name,SortName',
      SortOrder: sortOrderMap.jellyfin[query.sortOrder],
      StartIndex: query.startIndex,
      UserId: apiClientProps.server?.userId || undefined,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to get album artist list');
  }

  return {
    items: res.body.Items.map((item) => jfNormalize.albumArtist(item, apiClientProps.server)),
    startIndex: query.startIndex,
    totalRecordCount: res.body.TotalRecordCount,
  };
};

const getArtistList = async (args: ArtistListArgs): Promise<AlbumArtistListResponse> => {
  const { query, apiClientProps } = args;

  const res = await jfApiClient(apiClientProps).getAlbumArtistList({
    query: {
      Limit: query.limit,
      ParentId: query.musicFolderId,
      Recursive: true,
      SortBy: artistListSortMap.jellyfin[query.sortBy] || 'Name,SortName',
      SortOrder: sortOrderMap.jellyfin[query.sortOrder],
      StartIndex: query.startIndex,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to get artist list');
  }

  return {
    items: res.body.Items.map((item) => jfNormalize.albumArtist(item, apiClientProps.server)),
    startIndex: query.startIndex,
    totalRecordCount: res.body.TotalRecordCount,
  };
};

const getAlbumDetail = async (args: AlbumDetailArgs): Promise<AlbumDetailResponse> => {
  const { query, apiClientProps } = args;

  if (!apiClientProps.server?.userId) {
    throw new Error('No userId found');
  }

  const res = await jfApiClient(apiClientProps).getAlbumDetail({
    params: {
      id: query.id,
      userId: apiClientProps.server.userId,
    },
    query: {
      Fields: 'Genres, DateCreated, ChildCount',
    },
  });

  const songsRes = await jfApiClient(apiClientProps).getSongList({
    params: {
      userId: apiClientProps.server.userId,
    },
    query: {
      Fields: 'Genres, DateCreated, MediaSources, ParentId',
      IncludeItemTypes: 'Audio',
      ParentId: query.id,
      SortBy: 'Album,SortName',
    },
  });

  if (res.status !== 200 || songsRes.status !== 200) {
    throw new Error('Failed to get album detail');
  }

  return jfNormalize.album({ ...res.body, Songs: songsRes.body.Items }, apiClientProps.server);
};

const getAlbumList = async (args: AlbumListArgs): Promise<AlbumListResponse> => {
  const { query, apiClientProps } = args;

  if (!apiClientProps.server?.userId) {
    throw new Error('No userId found');
  }

  const yearsGroup = [];
  if (query._custom?.jellyfin?.minYear && query._custom?.jellyfin?.maxYear) {
    for (
      let i = Number(query._custom?.jellyfin?.minYear);
      i <= Number(query._custom?.jellyfin?.maxYear);
      i += 1
    ) {
      yearsGroup.push(String(i));
    }
  }

  const yearsFilter = yearsGroup.length ? yearsGroup.join(',') : undefined;

  const res = await jfApiClient(apiClientProps).getAlbumList({
    params: {
      userId: apiClientProps.server?.userId,
    },
    query: {
      AlbumArtistIds: query.artistIds ? formatCommaDelimitedString(query.artistIds) : undefined,
      IncludeItemTypes: 'MusicAlbum',
      Limit: query.limit,
      ParentId: query.musicFolderId,
      Recursive: true,
      SearchTerm: query.searchTerm,
      SortBy: albumListSortMap.jellyfin[query.sortBy] || 'SortName',
      SortOrder: sortOrderMap.jellyfin[query.sortOrder],
      StartIndex: query.startIndex,
      ...query._custom?.jellyfin,
      Years: yearsFilter,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to get album list');
  }

  return {
    items: res.body.Items.map((item) => jfNormalize.album(item, apiClientProps.server)),
    startIndex: query.startIndex,
    totalRecordCount: res.body.TotalRecordCount,
  };
};

const getTopSongList = async (args: TopSongListArgs): Promise<SongListResponse> => {
  const { apiClientProps, query } = args;

  if (!apiClientProps.server?.userId) {
    throw new Error('No userId found');
  }

  const res = await jfApiClient(apiClientProps).getTopSongsList({
    params: {
      userId: apiClientProps.server?.userId,
    },
    query: {
      ArtistIds: query.artistId,
      Fields: 'Genres, DateCreated, MediaSources, ParentId',
      IncludeItemTypes: 'Audio',
      Limit: query.limit,
      Recursive: true,
      SortBy: 'CommunityRating,SortName',
      SortOrder: 'Descending',
      UserId: apiClientProps.server?.userId,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to get top song list');
  }

  return {
    items: res.body.Items.map((item) => jfNormalize.song(item, apiClientProps.server, '')),
    startIndex: 0,
    totalRecordCount: res.body.TotalRecordCount,
  };
};

const getSongList = async (args: SongListArgs): Promise<SongListResponse> => {
  const { query, apiClientProps } = args;

  if (!apiClientProps.server?.userId) {
    throw new Error('No userId found');
  }

  const yearsGroup = [];
  if (query._custom?.jellyfin?.minYear && query._custom?.jellyfin?.maxYear) {
    for (
      let i = Number(query._custom?.jellyfin?.minYear);
      i <= Number(query._custom?.jellyfin?.maxYear);
      i += 1
    ) {
      yearsGroup.push(String(i));
    }
  }

  const yearsFilter = yearsGroup.length ? formatCommaDelimitedString(yearsGroup) : undefined;
  const albumIdsFilter = query.albumIds ? formatCommaDelimitedString(query.albumIds) : undefined;
  const artistIdsFilter = query.artistIds ? formatCommaDelimitedString(query.artistIds) : undefined;

  const res = await jfApiClient(apiClientProps).getSongList({
    params: {
      userId: apiClientProps.server?.userId,
    },
    query: {
      AlbumIds: albumIdsFilter,
      ArtistIds: artistIdsFilter,
      Fields: 'Genres, DateCreated, MediaSources, ParentId',
      IncludeItemTypes: 'Audio',
      Limit: query.limit,
      ParentId: query.musicFolderId,
      Recursive: true,
      SearchTerm: query.searchTerm,
      SortBy: songListSortMap.jellyfin[query.sortBy] || 'Album,SortName',
      SortOrder: sortOrderMap.jellyfin[query.sortOrder],
      StartIndex: query.startIndex,
      ...query._custom?.jellyfin,
      Years: yearsFilter,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to get song list');
  }

  return {
    items: res.body.Items.map((item) => jfNormalize.song(item, apiClientProps.server, '')),
    startIndex: query.startIndex,
    totalRecordCount: res.body.TotalRecordCount,
  };
};

const addToPlaylist = async (args: AddToPlaylistArgs): Promise<AddToPlaylistResponse> => {
  const { query, body, apiClientProps } = args;

  if (!apiClientProps.server?.userId) {
    throw new Error('No userId found');
  }

  const res = await jfApiClient(apiClientProps).addToPlaylist({
    body: {
      Ids: body.songId,
      UserId: apiClientProps?.server?.userId,
    },
    params: {
      id: query.id,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to add to playlist');
  }

  return null;
};

const removeFromPlaylist = async (
  args: RemoveFromPlaylistArgs,
): Promise<RemoveFromPlaylistResponse> => {
  const { query, apiClientProps } = args;

  const res = await jfApiClient(apiClientProps).removeFromPlaylist({
    body: null,
    params: {
      id: query.id,
    },
    query: {
      EntryIds: query.songId,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to remove from playlist');
  }

  return null;
};

const getPlaylistDetail = async (args: PlaylistDetailArgs): Promise<PlaylistDetailResponse> => {
  const { query, apiClientProps } = args;

  if (!apiClientProps.server?.userId) {
    throw new Error('No userId found');
  }

  const res = await jfApiClient(apiClientProps).getPlaylistDetail({
    params: {
      id: query.id,
      userId: apiClientProps.server?.userId,
    },
    query: {
      Fields: 'Genres, DateCreated, MediaSources, ChildCount, ParentId',
      Ids: query.id,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to get playlist detail');
  }

  return jfNormalize.playlist(res.body, apiClientProps.server);
};

const getPlaylistSongList = async (args: PlaylistSongListArgs): Promise<SongListResponse> => {
  const { query, apiClientProps } = args;

  if (!apiClientProps.server?.userId) {
    throw new Error('No userId found');
  }

  const res = await jfApiClient(apiClientProps).getPlaylistSongList({
    params: {
      id: query.id,
    },
    query: {
      Fields: 'Genres, DateCreated, MediaSources, UserData, ParentId',
      IncludeItemTypes: 'Audio',
      Limit: query.limit,
      SortBy: query.sortBy ? songListSortMap.jellyfin[query.sortBy] : undefined,
      SortOrder: query.sortOrder ? sortOrderMap.jellyfin[query.sortOrder] : undefined,
      StartIndex: 0,
      UserId: apiClientProps.server?.userId,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to get playlist song list');
  }

  return {
    items: res.body.Items.map((item) => jfNormalize.song(item, apiClientProps.server, '')),
    startIndex: query.startIndex,
    totalRecordCount: res.body.TotalRecordCount,
  };
};

const getPlaylistList = async (args: PlaylistListArgs): Promise<PlaylistListResponse> => {
  const { query, apiClientProps } = args;

  if (!apiClientProps.server?.userId) {
    throw new Error('No userId found');
  }

  const res = await jfApiClient(apiClientProps).getPlaylistList({
    params: {
      userId: apiClientProps.server?.userId,
    },
    query: {
      Fields: 'ChildCount, Genres, DateCreated, ParentId, Overview',
      IncludeItemTypes: 'Playlist',
      Limit: query.limit,
      MediaTypes: 'Audio',
      Recursive: true,
      SortBy: playlistListSortMap.jellyfin[query.sortBy],
      SortOrder: sortOrderMap.jellyfin[query.sortOrder],
      StartIndex: query.startIndex,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to get playlist list');
  }

  return {
    items: res.body.Items.map((item) => jfNormalize.playlist(item, apiClientProps.server)),
    startIndex: 0,
    totalRecordCount: res.body.TotalRecordCount,
  };
};

const createPlaylist = async (args: CreatePlaylistArgs): Promise<CreatePlaylistResponse> => {
  const { body, apiClientProps } = args;

  if (!apiClientProps.server?.userId) {
    throw new Error('No userId found');
  }

  const res = await jfApiClient(apiClientProps).createPlaylist({
    body: {
      MediaType: 'Audio',
      Name: body.name,
      Overview: body.comment || '',
      UserId: apiClientProps.server.userId,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to create playlist');
  }

  return {
    id: res.body.Id,
  };
};

const updatePlaylist = async (args: UpdatePlaylistArgs): Promise<UpdatePlaylistResponse> => {
  const { query, body, apiClientProps } = args;

  if (!apiClientProps.server?.userId) {
    throw new Error('No userId found');
  }

  const res = await jfApiClient(apiClientProps).updatePlaylist({
    body: {
      Genres: body.genres?.map((item) => ({ Id: item.id, Name: item.name })) || [],
      MediaType: 'Audio',
      Name: body.name,
      Overview: body.comment || '',
      PremiereDate: null,
      ProviderIds: {},
      Tags: [],
      UserId: apiClientProps.server?.userId, // Required
    },
    params: {
      id: query.id,
    },
  });

  if (res.status !== 200) {
    throw new Error('Failed to update playlist');
  }

  return null;
};

const deletePlaylist = async (args: DeletePlaylistArgs): Promise<null> => {
  const { query, apiClientProps } = args;

  const res = await jfApiClient(apiClientProps).deletePlaylist({
    body: null,
    params: {
      id: query.id,
    },
  });

  if (res.status !== 204) {
    throw new Error('Failed to delete playlist');
  }

  return null;
};

const createFavorite = async (args: FavoriteArgs): Promise<FavoriteResponse> => {
  const { query, apiClientProps } = args;

  if (!apiClientProps.server?.userId) {
    throw new Error('No userId found');
  }

  for (const id of query.id) {
    await jfApiClient(apiClientProps).createFavorite({
      body: {},
      params: {
        id,
        userId: apiClientProps.server?.userId,
      },
    });
  }

  return null;
};

const deleteFavorite = async (args: FavoriteArgs): Promise<FavoriteResponse> => {
  const { query, apiClientProps } = args;

  if (!apiClientProps.server?.userId) {
    throw new Error('No userId found');
  }

  for (const id of query.id) {
    await jfApiClient(apiClientProps).removeFavorite({
      body: {},
      params: {
        id,
        userId: apiClientProps.server?.userId,
      },
    });
  }

  return null;
};

const scrobble = async (args: ScrobbleArgs): Promise<ScrobbleResponse> => {
  const { query, apiClientProps } = args;

  const position = query.position && Math.round(query.position);

  if (query.submission) {
    // Checked by jellyfin-plugin-lastfm for whether or not to send the "finished" scrobble (uses PositionTicks)
    jfApiClient(apiClientProps).scrobbleStopped({
      body: {
        IsPaused: true,
        ItemId: query.id,
        PositionTicks: position,
      },
    });

    return null;
  }

  if (query.event === 'start') {
    jfApiClient(apiClientProps).scrobblePlaying({
      body: {
        ItemId: query.id,
        PositionTicks: position,
      },
    });

    return null;
  }

  if (query.event === 'pause') {
    jfApiClient(apiClientProps).scrobbleProgress({
      body: {
        EventName: query.event,
        IsPaused: true,
        ItemId: query.id,
        PositionTicks: position,
      },
    });

    return null;
  }

  if (query.event === 'unpause') {
    jfApiClient(apiClientProps).scrobbleProgress({
      body: {
        EventName: query.event,
        IsPaused: false,
        ItemId: query.id,
        PositionTicks: position,
      },
    });

    return null;
  }

  jfApiClient(apiClientProps).scrobbleProgress({
    body: {
      ItemId: query.id,
      PositionTicks: position,
    },
  });

  return null;
};

export const jfController = {
  addToPlaylist,
  authenticate,
  createFavorite,
  createPlaylist,
  deleteFavorite,
  deletePlaylist,
  getAlbumArtistDetail,
  getAlbumArtistList,
  getAlbumDetail,
  getAlbumList,
  getArtistList,
  getGenreList,
  getMusicFolderList,
  getPlaylistDetail,
  getPlaylistList,
  getPlaylistSongList,
  getSongList,
  getTopSongList,
  removeFromPlaylist,
  scrobble,
  updatePlaylist,
};