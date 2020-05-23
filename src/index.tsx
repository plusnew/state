import { context } from "@plusnew/core";
import type { entitiesContainerTemplate } from "./types";
import repositoryFactory from "./components/repositoryFactory";
import type {
  repositoryState,
  repositoryActions,
} from "./components/repositoryFactory";
import type { branchState, branchActions } from "./components/branchFactory";
import branchFactory from "./components/branchFactory";
import itemFactory from "./components/itemFactory";
import listFactory from "./components/listFactory";

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
