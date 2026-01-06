#pragma once

#include "util.h"
#include <datastructures/tree.h>


namespace WiggleMin 
{

// Use the indices of the tree as the order directly
void minimizeWiggles(TemporalTree &tree, bool verbose, bool weighted, bool quadratic, bool symmetric, double percentpadding, double percentpaddingused, int threads, bool isIgnoreRootForWiggleMinimization, bool isOnlyLeaves);

void minimizeWigglesComp(TemporalTree &tree1, TemporalTree &tree2, bool verbose, bool weighted, bool quadratic, bool symmetric, double percentpadding, double percentpaddingused, int threads, bool isIgnoreRootForWiggleMinimization, bool isOnlyLeaves);

void minimizeWigglesCompFixFirst(TemporalTree &tree1, TemporalTree &tree2, bool verbose, bool weighted, bool quadratic, bool symmetric, double percentpadding, double percentpaddingused, int threads, bool isIgnoreRootForWiggleMinimization, bool isOnlyLeaves);

} // namespace WiggleMin