import { context } from "@plusnew/core";
import type {
  dataState,
  dataActions,
  repositoryState,
} from "./types/dataContext";
import branchFactory from "./components/branchFactory";
import itemFactory from "./components/itemFactory";
import listFactory from "./components/listFactory";
import mergeFactory from "./components/mergeFactory";
import reduceFactory from "./components/reduceFactory";
import repositoryFactory from "./components/repositoryFactory";
import type { entitiesContainerTemplate } from "./types";

export default function factory<T extends entitiesContainerTemplate>() {
  const dataContext = context<
    dataState<T> & repositoryState<T>,
    dataActions<T>
  >();

  return {
    Repository: repositoryFactory(dataContext),
    Branch: branchFactory(dataContext),
    List: listFactory(dataContext),
    Item: itemFactory(dataContext),
    Reduce: reduceFactory(dataContext),
    Merge: mergeFactory(dataContext),
    dataContext: dataContext,
  };
}
