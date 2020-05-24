export type entityEmpty<entityName> = {
  id: string;
  model: entityName;
};

export type entityTemplate<entityName> = {
  listParameter: any;
  item: {
    id: string;
    model: entityName;
    attributes: Record<string, unknown>;
    relationships: {
      [key: string]: entityEmpty<entityName> | entityEmpty<entityName>[];
    };
  };
};

export type entitiesContainerTemplate = {
  [key: string]: entityTemplate<string>;
};
