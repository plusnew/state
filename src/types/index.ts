export type idTemplate =
  | string
  | number
  | boolean
  | { [key: string]: idTemplate };

export type entityEmpty<entityName, id extends idTemplate> = {
  id: id;
  model: entityName;
};

export type entityTemplate<entityName> = {
  listParameter: any;
  item: {
    id: idTemplate;
    model: entityName;
    attributes: Record<string, unknown>;
    relationships: {
      [key: string]:
        | entityEmpty<entityName, idTemplate>
        | entityEmpty<entityName, idTemplate>[];
    };
  };
};

export type entitiesContainerTemplate = {
  [key: string]: entityTemplate<string>;
};
