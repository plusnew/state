import type { entitiesContainerTemplate, entityEmpty } from "./index";

export type syncReadListRequest<
  T extends entitiesContainerTemplate,
  U extends keyof T
> = (request: { model: U; parameter: T[U]["listParameter"] }) =>
  | {
      hasError: false;
      isLoading: boolean;
      items: T[U]["item"][] | entityEmpty<U, T[U]["item"]["id"]>[];
      totalCount: number;
    }
  | {
      hasError: true;
      error: any;
    };

export type syncReadItemRequest<
  T extends entitiesContainerTemplate,
  U extends keyof T
> = (request: {
  model: U;
  id: T[U]["item"]["id"];
}) =>
  | { hasError: true; error: any }
  | { hasError: false; isLoading: false; item: T[U]["item"] }
  | { hasError: false; isLoading: true; item: T[U]["item"] | null };

export type itemsInsertAction<T extends entitiesContainerTemplate> = {
  type: "ITEMS_INSERT";
  payload: {
    items: {
      [U in keyof T]?: {
        [id: string]:
          | { isDeleted: false; item: T[U]["item"] }
          | { isDeleted: true };
      };
    };
    invalidateInvolvedListCaches: boolean;
  };
};

type changedAttributes<
  T extends entitiesContainerTemplate,
  U extends keyof T
> = {
  type: "ATTRIBUTES_CHANGE";
  model: U;
  id: string;
  payload: Partial<T[U]["item"]["attributes"]>;
};

type changedRelationships<
  T extends entitiesContainerTemplate,
  U extends keyof T
> = {
  type: "RELATIONSHIPS_CHANGE";
  model: U;
  id: string;
  payload: Partial<T[U]["item"]["relationships"]>;
};

type resetChangelog<T extends entitiesContainerTemplate> = {
  type: "RESET_CHANGELOG";
  payload: {
    [U in keyof T]: string[];
  };
};

type changeLog<T extends entitiesContainerTemplate, U extends keyof T> =
  | changedAttributes<T, U>
  | changedRelationships<T, U>;

export type storeEntity<
  T extends entitiesContainerTemplate,
  U extends keyof T
> =
  | {
      hasError: false;
      isDeleted: false;
      payload: T[U]["item"];
    }
  | {
      hasError: true;
      error: any;
      isDeleted: false;
    }
  | {
      hasError: false;
      isDeleted: true;
    };

export type storeList = {
  [query: string]:
    | {
        hasError: false;
        ids: string[];
        totalCount: number;
        hasInvalidCache: boolean;
      }
    | {
        hasError: true;
        error: any;
      };
};

export type repositoryState<T extends entitiesContainerTemplate> = {
  entities: {
    [model in keyof T]?: {
      [id: string]: storeEntity<T, model>;
    };
  };
  lists: {
    [model in keyof T]?: storeList;
  };
};

export type dataState<T extends entitiesContainerTemplate> = {
  getListCache: syncReadListRequest<T, keyof T>;
  getItemCache: syncReadItemRequest<T, keyof T>;
  changeLog: changeLog<T, keyof T>[];
};

export type dataActions<T extends entitiesContainerTemplate> =
  | itemsInsertAction<T>
  | changedAttributes<T, keyof T>
  | changedRelationships<T, keyof T>
  | resetChangelog<T>;
