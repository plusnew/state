import { context } from "@plusnew/core";
import branchFactory from "./components/branchFactory";
import type { branchActions, branchState } from "./components/branchFactory";
import itemFactory from "./components/itemFactory";
import listFactory from "./components/listFactory";
import repositoryFactory from "./components/repositoryFactory";
import type {
  repositoryActions,
  repositoryState,
} from "./components/repositoryFactory";
import type { entitiesContainerTemplate } from "./types";

export default function factory<T extends entitiesContainerTemplate>() {
  const repositoryContext = context<repositoryState<T>, repositoryActions<T>>();
  const branchContext = context<branchState<T>, branchActions<T>>();

  return {
    Repository: repositoryFactory(repositoryContext),
    Branch: branchFactory(repositoryContext, branchContext),
    List: listFactory(branchContext),
    Item: itemFactory(branchContext),
  };
}
