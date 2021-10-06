import { context } from "@plusnew/core";
import branchFactory from "./components/branchFactory";
import type { branchActions, branchState } from "./components/branchFactory";
import itemFactory from "./components/itemFactory";
import listFactory from "./components/listFactory";
import mergeFactory from "./components/mergeFactory";
import reduceFactory from "./components/reduceFactory";
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
    List: listFactory(repositoryContext, branchContext),
    Item: itemFactory(repositoryContext, branchContext),
    Reduce: reduceFactory(repositoryContext, branchContext),
    Merge: mergeFactory(repositoryContext, branchContext),
    RepositoryContextConsumer: repositoryContext.Consumer,
    BranchContextConsumer: branchContext.Consumer,
  };
}
