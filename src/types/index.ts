export type entityTemplate<entityNames> = {
  listParameter: any;
  item: {
    id: string;
    attributes: {};
    relationships: {
      [key: string]: entityEmpty<entityNames> | entityEmpty<entityNames>[];
    };
  };
};

export type entityEmpty<entityNames> = {
  id: string;
  type: entityNames;
};

export type entitiesContainerTemplate = {
  [key: string]: entityTemplate<string>;
};
