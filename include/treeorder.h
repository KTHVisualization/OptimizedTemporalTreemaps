#pragma once

#include <datastructures/tree.h>
#include "util.h"

namespace TreeOrder 
{

// Use the indices of the tree as the order directly
void orderAsInserted(TemporalTree::TTreeOrder& order, const TemporalTree& tree);

// From tree(leaves) order to order map
void toOrderMap(TemporalTree::TTreeOrderMap& orderMap, const TemporalTree::TTreeOrder& order);

void orderGurobiCrossingMinimization(TemporalTree::TTreeOrder& order, const TemporalTree& tree, bool verbose, int threads);

void orderGurobiCrossingMinimizationComp(TemporalTree::TTreeOrder& order, const TemporalTree& tree1, const TemporalTree& tree2, bool verbose, int threads);

void orderGurobiCrossingMinimizationCompFixFirst(TemporalTree::TTreeOrder& order1, TemporalTree::TTreeOrder& order2, TemporalTree& tree1, TemporalTree& tree2, bool verbose, int threads);

void orderMedianCrossingMinimization(TemporalTree::TTreeOrder& order, TemporalTree& tree);

unsigned long long countCrossings(const TemporalTree& tree);

} // namespace TreeOrder