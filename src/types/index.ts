export type entityEmpty<entityName, id extends string | number> = {
  id: id;
  model: entityName;
};

export type entityTemplate<entityName> = {
  listParameter: any;
  item: {
    id: string | number;
    model: entityName;
    attributes: Record<string, unknown>;
    relationships: {
      [key: string]:
        | entityEmpty<entityName, string | number>
        | entityEmpty<entityName, string | number>[];
    };
  };
};

export type entitiesContainerTemplate = {
  [key: string]: entityTemplate<string>;
};
