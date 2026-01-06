#include <datastructures/tree.h>

size_t TemporalTree::addNode(const TNode& node)
{
    nodes.push_back(node);
    return nodes.size() - 1;
}

size_t TemporalTree::addNode(const std::string& name,
                            const uint64_t timeStep, 
                            const double areaValues,
                            const double scalarValues)
{
    nodes.emplace_back(name, timeStep, areaValues, scalarValues);
    return nodes.size() - 1;
}

size_t TemporalTree::addChild(const size_t parent, const std::string& name,
                                const double areaValues,
                                const double scalarValues)
{
    // Deaggregated node, child has the same timestep as parent
    const auto timeStep = nodes[parent].timeStep;
    const auto childIdx = this->addNode(name, timeStep, areaValues, scalarValues);
    this->addHierarchyEdge(parent, childIdx);

    return childIdx;
}

void TemporalTree::addTimeStep(const size_t nodeIdx, const uint64_t time)
{
    TNode& node = nodes[nodeIdx];
    node.timeStep = time;
}

void TemporalTree::addScalarValue(const size_t nodeIdx, const double dataValue)
{
    TNode& node = nodes[nodeIdx];
    node.scalarValue = dataValue;
}

void TemporalTree::addAreaValue(const size_t nodeIdx, const double dataValue)
{
    TNode& node = nodes[nodeIdx];
    node.areaValue = dataValue;
}

void TemporalTree::addHierarchyEdge(const size_t from, const size_t to)
{
    // Either create a new entry or update the entry for the from-key
    auto itToAdd = edgesHierarchy.find(from);
    // If not found
    if (itToAdd == edgesHierarchy.end())
    {
        TAdjacency::mapped_type edgeToAdd = {to};
        edgesHierarchy.emplace(from, edgeToAdd);
    }
    else {
        itToAdd->second.push_back(to);
    }
    // Update the parent Idx
    nodes[to].setParentIdx(from);
}

void TemporalTree::addTemporalEdge(const size_t from, const size_t to)
{
    // Either create a new entry or update the entry
    auto itToAdd = edgesTime.find(from);
    // If not found
    if (itToAdd == edgesTime.end())
    {
        TAdjacency::mapped_type edgeToAdd = {to};
        edgesTime.emplace(from, edgeToAdd);
    }
    else {
        itToAdd->second.push_back(to);
    }
}

void TemporalTree::addLayout(const size_t nodeIdx, const double x_, const double y_, const double width_)
{
    TNode& node = nodes[nodeIdx];
    node.layout.x = x_;
    node.layout.y = y_;
    node.layout.width = width_;
}

void TemporalTree::addId(const size_t nodeIdx, const size_t explicitNodeIdx)
{
    TNode& node = nodes[nodeIdx];
    node.id = explicitNodeIdx;
}


std::vector<size_t> TemporalTree::getLevel(const size_t level,
                                           const std::vector<size_t>& prevLevelIdx,
                                           const size_t prevLevel) const 
{
    size_t currentLevel;
    std::set<size_t> currentLevelIdx;

    // Use the given prevLevel is is set
    if (!prevLevelIdx.empty())
    {
        if (level < prevLevel)
        {
            std::cout<<"Desired level needs to be larger than the given one\n";
            return {}; 
        }
        currentLevelIdx.insert(prevLevelIdx.cbegin(), prevLevelIdx.cend());
        currentLevel = prevLevel;
    }
    else {
        // At level 0, we look at the root nodes
        // We suppose root can be different than 0
        currentLevel = 0;
        auto roots = getRoots();
        currentLevelIdx.insert(roots.cbegin(), roots.cend());
    }

    std::set<size_t> nextLevelIndices;
    while (currentLevel < level)
    {
        nextLevelIndices.clear();

        // Get all children of Nodes in the current level
        for (const auto parentIdx: currentLevelIdx)
        {
            std::map<size_t, std::vector<size_t>>::const_iterator it = edgesHierarchy.find(parentIdx);
            if (it != edgesHierarchy.end())
            {
                // If found
                nextLevelIndices.insert(it->second.cbegin(), it->second.cend());
            }
        }

        // Update the current level
        currentLevel++ ;
        currentLevelIdx = nextLevelIndices;
    }

    return std::vector<size_t>(currentLevelIdx.cbegin(), currentLevelIdx.cend());
}

size_t TemporalTree::getNumLevels(const size_t nodeIdx) const
{
    // Check if the node idx is a leaf
    // Node has no children if it has no outgoing hierarchical edges
    auto it = edgesHierarchy.find(nodeIdx);
    if (it == edgesHierarchy.end())
    {
        return 0;
    }
    else {
        // Not a leaf
        size_t maxChildrenLevel(0);
        for (const auto& id: it->second)
        {
            // For each child
            // Find the depth of the child
            const size_t thisChildDepth = getNumLevels(id);
            if (thisChildDepth > maxChildrenLevel)
                maxChildrenLevel = thisChildDepth;
        }

        return 1 + maxChildrenLevel;
    }
}


std::vector<size_t> TemporalTree::getLeaves() const
{
    std::vector<size_t> leaves;

    // Find all nodes that do not have children and have parent
    for (size_t nodeIdx = 0; nodeIdx < nodes.size(); nodeIdx++)
    {
        // Node has no children if it has no outgoing hierarchical edges  
        if (this->isLeaf(nodeIdx))
        {
            leaves.push_back(nodeIdx);
        }
    }
    
    return leaves;
}


std::vector<size_t> TemporalTree::getRoots() const 
{
    std::vector<size_t> roots;

    // Find all nodes that do not have parent
    for (size_t nodeIdx = 0; nodeIdx < nodes.size(); nodeIdx++)
    {
        if (!nodes[nodeIdx].parentIdx.has_value())
        {
            roots.push_back(nodeIdx);
        }
    }
    return roots;
}

std::vector<size_t> TemporalTree::getInners() const
{
    std::vector<size_t> inners;

    // Find all nodes that have a parent and have outgoing edges
    for (size_t nodeIdx = 0; nodeIdx < nodes.size(); nodeIdx++)
    {
        auto it = edgesHierarchy.find(nodeIdx);
        if (nodes[nodeIdx].parentIdx.has_value() && (it != edgesHierarchy.end()))
        {
            inners.push_back(nodeIdx);
        }
    }

    return inners;
}


std::vector<size_t> TemporalTree::getLeavesTimestep(const uint64_t timeStep) const
{
    std::vector<size_t> leaves;

    // Find all nodes that do not have children and have a parent
    for (size_t nodeIdx = 0; nodeIdx < nodes.size(); nodeIdx++)
    {
        // Node of this timestep
        if ((nodes[nodeIdx].timeStep == timeStep) && 
            (edgesHierarchy.find(nodeIdx) != edgesHierarchy.end()) &&
            (nodes[nodeIdx].parentIdx.has_value())
            )
        {
        // Node has no children if it has no outgoing hierarchical edges
           leaves.push_back(nodeIdx);
        }
    }
    
    return leaves;
}


std::vector<size_t> TemporalTree::getRootTimestep(const uint64_t timeStep) const
{
    std::vector<size_t> roots;

    // Find nodes that do not have parent
    for (size_t nodeIdx = 0; nodeIdx < nodes.size(); nodeIdx++)
    {
        // Node of this timestep
        if ((nodes[nodeIdx].timeStep == timeStep) &&
            (!nodes[nodeIdx].parentIdx.has_value()))
        {
            roots.push_back(nodeIdx);
        }
    }
    return roots;
}

std::vector<size_t> TemporalTree::getInnersTimestep(const uint64_t timeStep) const
{
    std::vector<size_t> inners;

    // Find all nodes that have a parent and have outgoing edges
    for (size_t nodeIdx = 0; nodeIdx < nodes.size(); nodeIdx++)
    {
        if ((nodes[nodeIdx].timeStep == timeStep) && 
            (nodes[nodeIdx].parentIdx.has_value()) && 
            ((edgesHierarchy.find(nodeIdx) != edgesHierarchy.end())))
        {
           inners.push_back(nodeIdx);
        }
    }

    return inners;
}

std::vector<size_t> TemporalTree::getLevelTimestep(const size_t level, 
                                        const uint64_t timeStep,
                                        const std::vector<size_t>& prevLevelIdx, 
                                        const size_t prevLevel) const
{
    std::vector<size_t> results;

    auto nodesIdxLevel = getLevel(level, prevLevelIdx, prevLevel);

    for (auto& nodeIdx: nodesIdxLevel)
    {
        if (nodes[nodeIdx].timeStep == timeStep)
        {
            results.push_back(nodeIdx);
        }
    }

    return results;
}

std::vector<size_t> TemporalTree::getNodesTimeStep(const uint64_t timeStep) const 
{
    std::vector<size_t> results;

    // Loop for every node
    for (size_t nodeIdx = 0; nodeIdx < nodes.size(); nodeIdx++)
    {
        if (nodes[nodeIdx].timeStep == timeStep)
        {
            results.push_back(nodeIdx);
        }
    }

    return results;
}


size_t TemporalTree::depth(const size_t nodeIdx) const 
{
    auto parents = getHierarchicalParents(nodeIdx);

    if (parents.size() == 0)
    {
        return 0;
    }

    return 1 + depth(parents[0]);
}

std::vector<size_t> TemporalTree::getTemporalSuccessors(const size_t nodeIdx) const 
{
    return getEdgesFrom(nodeIdx, edgesTime);
}

std::vector<size_t> TemporalTree::getTemporalPredecessors(const size_t nodeIdx) const
{
    return getEdgesFrom(nodeIdx, reverseEdgesTime);
}

std::vector<size_t> TemporalTree::getHierarchicalParents(const size_t nodeIdx) const 
{
    return getEdgesFrom(nodeIdx, reverseEdgesHierarchy);
}

std::vector<size_t> TemporalTree::getHierarchicalChildren(const size_t nodeIdx) const 
{
    return getEdgesFrom(nodeIdx, edgesHierarchy);
}


void TemporalTree::getHierarchicalAncestors(const size_t nodeIdx, std::vector<size_t>& ancestors) const 
{
    // Using the reverse cache
    auto parentsIdx = getHierarchicalParents(nodeIdx);
    // Add this to the list of ancestor
    ancestors.insert(ancestors.end(), parentsIdx.begin(), parentsIdx.end());

    for (auto parentIdx : parentsIdx)
    {
        getHierarchicalAncestors(parentIdx, ancestors);
    }
}

void TemporalTree::getHierarchicalDescendants(const size_t nodeIdx, std::vector<size_t>& descendants) const 
{
    auto childrenIdx = getHierarchicalChildren(nodeIdx);
    // Add this to the list of descendants
    descendants.insert(descendants.end(), childrenIdx.begin(), childrenIdx.end());

    for (auto childIdx : childrenIdx)
    {
        getHierarchicalDescendants(childIdx, descendants);
    }
}



std::vector<size_t> TemporalTree::getBornNodes(bool isGetFirstTimestep)
{
    // Prepare the nodes
    std::vector<size_t> bornNodes;
    bornNodes.clear();

    // Compute the temporalReverEdge if they are not there
    if (reverseEdgesTime.empty())
    {
        reverseEdgesTime = getReverseEdges(edgesTime);
    }

    // Loop for every node
    for (size_t nodeIdx = 0; nodeIdx < nodes.size(); nodeIdx++)
    {
        // Get the temporal predecessor
        const auto temporalPredecessors = getTemporalPredecessors(nodeIdx);
        // If this node have no predecessor
        if (temporalPredecessors.size() == 0)
        {   
            if (isGetFirstTimestep)
            {
                bornNodes.push_back(nodeIdx);
            }
            else if (!isGetFirstTimestep && nodes[nodeIdx].timeStep != *times.begin())
            {
                bornNodes.push_back(nodeIdx);
            }
        }
    }

    return bornNodes;
}

std::vector<size_t> TemporalTree::getDieNodes(bool isGetLastTimestep)
{
    // Prepare the list
    std::vector<size_t> dieNodes;
    dieNodes.clear();
    
    // Loop for every node

    for (size_t nodeIdx = 0; nodeIdx < nodes.size(); nodeIdx++)
    {
        // Get the temporal successors
        const auto temporalSuccessors = getTemporalSuccessors(nodeIdx);
        // If this node have no successor
        if (temporalSuccessors.size() == 0)
        {
            if (isGetLastTimestep)
            {
                dieNodes.push_back(nodeIdx);
            }
            else if (!isGetLastTimestep && nodes[nodeIdx].timeStep != *std::prev(times.end()))
            {
                dieNodes.push_back(nodeIdx);
            }
        }
    }

    return dieNodes;
}

size_t TemporalTree::getNumEdges(const TAdjacency& edges) const 
{
    // Loop through every element of the given edges structure
    size_t total = 0;

    for (const auto& edgeGroup: edges)
    {
        total += edgeGroup.second.size();
    }

    return total;
}

std::map<size_t, std::vector<size_t>> TemporalTree::getReverseEdges(const TAdjacency& edges) const
{
    using EdgesMap = std::map<size_t, std::vector<size_t>>;
    // Structure to store the result
    EdgesMap reverseEdges;

    // Iterate through all edges and add reverse edges to the map
    EdgesMap::iterator itReverse;

    for (EdgesMap::const_iterator it = edges.begin(); it != edges.end(); it++)
    {
        for (auto edgeTo: it->second)
        {
            itReverse = reverseEdges.find(edgeTo);
            // If not found
            if (itReverse == reverseEdges.end())
            {
                // Create a new entry in the list
                std::vector<size_t> edgeFrom = {{it->first}};
                reverseEdges.emplace(edgeTo, edgeFrom);
            }
            else {
                // If found
                // Update the list
                itReverse->second.push_back(it->first);
            }
        }
    }

    return reverseEdges;
}

void TemporalTree::sortByTime(std::vector<size_t>& nodeIdxs) const 
{
    std::sort(nodeIdxs.begin(), nodeIdxs.end(),
        [&](const size_t idx1, const size_t idx2) -> bool {
            uint64_t t1 = nodes[idx1].timeStep;
            uint64_t t2 = nodes[idx2].timeStep;
            
            return t1 < t2;
        }
    );
}

void TemporalTree::sortByTimeBackward(std::vector<size_t>& nodeIdxs) const 
{
    std::sort(nodeIdxs.begin(), nodeIdxs.end(),
        [&](const size_t idx1, const size_t idx2) -> bool {
            uint64_t t1 = nodes[idx1].timeStep;
            uint64_t t2 = nodes[idx2].timeStep;

            return t1 > t2;
        }
    );
}

std::vector<size_t> TemporalTree::getEdgesFrom(const size_t nodeIdx, const TAdjacency& edges) const
{
    std::map<size_t, std::vector<size_t>>::const_iterator it = edges.find(nodeIdx);

    // Node has no successor if it has no outgoing edges
    if (it == edges.end())
    {
        return std::vector<size_t>();
    }
    
    return it->second;
}

std::vector<size_t> TemporalTree::getEdgesTo(const size_t nodeIdx, const TAdjacency& edges) const 
{
    std::vector<size_t> result;

    // Go through all edge and collect the ones that point to this node
    for (auto& it: edges)
    {
        for (auto& edgeTo: it.second)
        {
            if (edgeTo == nodeIdx)
            {
                result.push_back(it.first);
            }
        }
    }

    return result;
}

void preOrderHelper(std::vector<size_t>& preOrderIndex, int& counter, const size_t nodeIdx, const TemporalTree& tree) 
{
    preOrderIndex[nodeIdx] = counter++;
    for (auto child: tree.getHierarchicalChildren(nodeIdx)) {
        preOrderHelper(preOrderIndex, counter, child, tree);
    }
}

std::vector<size_t> TemporalTree::computePreorderIndex() const 
{
    std::vector<size_t> preOrderIndex(nodes.size());
    
    for (auto root: getRoots()) {
        int counter = 0;
        preOrderHelper(preOrderIndex, counter, root, *this);
    }    
    return preOrderIndex;
}

void postOrderHelper(std::vector<size_t>& postOrderIndex, int& counter, const size_t nodeIdx, const TemporalTree& tree) 
{
    for (auto child: tree.getHierarchicalChildren(nodeIdx)) {
        postOrderHelper(postOrderIndex, counter, child, tree);
    }
    postOrderIndex[nodeIdx] = counter++;
}

std::vector<size_t> TemporalTree::computePostOrderIndex() const 
{
    std::vector<size_t> postOrderIndex(nodes.size());
    for (auto root: getRoots()) {
        int counter = 0;
        postOrderHelper(postOrderIndex, counter, root, *this);
    }    
    return postOrderIndex;
}

void nodeToLeafDescendantHelper(std::vector<size_t>&  nodeToSomeLeafDescendant, size_t nodeIdx, const TemporalTree& tree) 
{
    if (tree.isLeaf(nodeIdx)) {
        nodeToSomeLeafDescendant[nodeIdx] = nodeIdx;
    }
    else {
        for (auto child: tree.getHierarchicalChildren(nodeIdx)) {
            nodeToLeafDescendantHelper(nodeToSomeLeafDescendant, child, tree);
            nodeToSomeLeafDescendant[nodeIdx] = nodeToSomeLeafDescendant[child];
        }
    }
}

std::vector<size_t> TemporalTree::computeNodeToSomeLeafDescendant() const
{
    std::vector<size_t> nodeToSomeLeafDescendant(nodes.size());
    for (auto root: getRoots()) {
        nodeToLeafDescendantHelper(nodeToSomeLeafDescendant, root, *this);
    }    
    return nodeToSomeLeafDescendant;
}

void leafDescendantsHelper(std::vector<size_t>& leafDescendants, size_t nodeIdx, const TemporalTree& tree)
{
    if (tree.isLeaf(nodeIdx)) {
        leafDescendants.push_back(nodeIdx);
    }
    else {
        for (auto child: tree.getHierarchicalChildren(nodeIdx)) {
            leafDescendantsHelper(leafDescendants, child, tree);
        }
    }
}

std::vector<size_t> TemporalTree::computeLeafDescendants(size_t nodeIdx) const
{
    std::vector<size_t> leafDescendants;
    leafDescendantsHelper(leafDescendants, nodeIdx, *this);
    return leafDescendants;
}



void TemporalTree::getSpecialEvents(std::set<size_t>& birthNodes, std::set<size_t>& deathNodes, 
                        std::map<size_t, std::vector<std::tuple<size_t, size_t, size_t>>>& parentChildSwitch
                        )
{
    // Get the reverse edge if they are not ready
    if (reverseEdgesHierarchy.empty())
    {
        reverseEdgesHierarchy = getReverseEdges(edgesHierarchy);
    }
    if (reverseEdgesTime.empty())
    {
        reverseEdgesTime = getReverseEdges(edgesTime);
    }

    // Initialize the results vectors
    birthNodes.clear();
    deathNodes.clear();
    parentChildSwitch.clear();

    // Start time and end time of the tree
    const auto startTime = *times.begin();
    const auto endTime = *std::prev(times.end());

    // Map to check for the visited edge during the process of parentChildSwitch detect
    std::map<std::pair<size_t, size_t>, bool> visitedParentChildSwitch;

    // We check for special events by looping through every nodes
    // By looping through all nodes
    for (size_t nodeIdx = 0; nodeIdx < nodes.size(); nodeIdx++)
    {      
        const auto& currNode = nodes[nodeIdx];
        // Check if it has any edge to it and it is not at the beginning
        if (getTemporalPredecessors(nodeIdx).empty() && currNode.timeStep != startTime)
        {
            // This node is born
            birthNodes.insert(nodeIdx);
        }

        const auto& temporalSuccesors = getTemporalSuccessors(nodeIdx);
        // Check if it has any edge from it and it is not at the end
        if (temporalSuccesors.empty() && currNode.timeStep != endTime)
        {
            // This node is death
            deathNodes.insert(nodeIdx);
        }

        if (!temporalSuccesors.empty())
        {
            // This node has edges from it
            // We check for the parent-child switch case
            processParentChildSwitch(nodeIdx, temporalSuccesors, parentChildSwitch, visitedParentChildSwitch);
        }
    }
}

std::vector<std::vector<std::string>> TemporalTree::getAllTemporalPaths() 
{
    // Get the born nodes
    std::vector<size_t> nodesBorn = getBornNodes(true);
    // Get the die nodes
    std::vector<size_t> nodesDie = getDieNodes(false);

    // Initialize
    std::vector<std::vector<std::string>> allTemporalPaths;
    allTemporalPaths.clear();

    for (const size_t startNode : nodesBorn)
    {
        allTemporalPaths.push_back(getTemporalPath(startNode, nodesBorn, nodesDie));
    }

    return allTemporalPaths;

}




std::vector<std::string> TemporalTree::getTemporalPath(const size_t startNodeIdx,
                                                      const std::vector<size_t>& listBornNodes,
                                                      const std::vector<size_t>& listDieNodes) 
{
    // The path string will consists of "idxStart-idxEnd" or "idx-a" 
    // It is extra information for the interaction part of the 
    std::vector<std::string> path;
    path.clear();
    std::queue<size_t> queueBFS;    // Q for BFS
    std::set<size_t> visited;       // Visited nodes
    visited.clear();

    // Mark the start node as visited
    visited.insert(startNodeIdx);

    // Add it to the queue
    queueBFS.push(startNodeIdx);

    // Iterate over the queue
    while (!queueBFS.empty())
    {
        // Deque
        size_t currNodeIdx = queueBFS.front();
        queueBFS.pop();

        // If the current node is the end or start of a new stream
        if (std::find(listBornNodes.begin(), listBornNodes.end(), currNodeIdx) != listBornNodes.end()
            || std::find(listDieNodes.begin(), listDieNodes.end(), currNodeIdx) != listDieNodes.end())
        {
            path.push_back(std::to_string(currNodeIdx) + "-a");
        }

        // Get the adjacent nodes of this node
        const auto adjNodes = getTemporalSuccessors(currNodeIdx);

        for (const auto adjNodeIdx : adjNodes)
        {
            // Check if this node has been visisted
            if (visited.find(adjNodeIdx) == visited.end())
            {
                // Add this one to the visis
                visited.insert(adjNodeIdx);
                queueBFS.push(adjNodeIdx);

                // Update the path information
                path.push_back(std::to_string(currNodeIdx) + "-" + std::to_string(adjNodeIdx));
            }
        }
    }

    return path;

}



void TemporalTree::processParentChildSwitch(const size_t startNodeIdx, const std::vector<size_t>& endNodesIdx,
                                            std::map<size_t, std::vector<std::tuple<size_t, size_t, size_t>>>& parentChildSwitch,
                                            std::map<std::pair<size_t, size_t>, bool>& visited
                                            ) const 
{
    // We check for the parent-child switch case
    // For each ending node starting node point to
    // It can happen if it pointing to a node of a different layer
    const auto depthStartNode = depth(startNodeIdx);
    
    // For each end node 
    for (const auto endNodeIdx : endNodesIdx)
    {
        // If node has been already visited
        if (visited.find(std::make_pair(startNodeIdx, endNodeIdx)) != visited.end() && visited.at(std::make_pair(startNodeIdx, endNodeIdx)))
            continue;
        // If the two nodes are at different layer
        const auto depthEndNode = depth(endNodeIdx);
        // There are two cases
        // But we only care about the case where start node is moving to a higher layer 
        if (depthStartNode < depthEndNode)
        {
            // The parent is moving to a higher layer
            // We check for all of the ancestors of the endNode
            std::vector<size_t> endNodeAncestorsIdx;
            endNodeAncestorsIdx.clear();
            getHierarchicalAncestors(endNodeIdx, endNodeAncestorsIdx);

            // Variables for storing information
            std::optional<std::pair<size_t, size_t>> highestSatisfiedEdge(std::nullopt);
            size_t highestSatisfiedLayer(depthStartNode);

            // For each of the ancestors, get its temporal predecessors
            for (const auto ancestorIdx : endNodeAncestorsIdx)
            {
                std::vector<size_t> predsAncestorIdx = getTemporalPredecessors(ancestorIdx);

                // For each of these ancestors's predecessor
                for (const auto predAncestorIdx : predsAncestorIdx)
                {
                    const auto depthPredAncestorIdx = depth(predAncestorIdx);
                    // If they are in a higher layer than the startNode
                    if (depthStartNode < depthPredAncestorIdx)
                    {
                        // Check if startNode is in the list of ancestor of the child's predecessor
                        std::vector<size_t> ancestorPredAncestor;
                        ancestorPredAncestor.clear();
                        getHierarchicalAncestors(predAncestorIdx, ancestorPredAncestor);

                        // If the startNode is the ancestor of the predecessor of the ancessor of the end node
                        if (std::find(ancestorPredAncestor.begin(), ancestorPredAncestor.end(), startNodeIdx) != ancestorPredAncestor.end())
                        {
                            // Update the highest node
                            if (depthPredAncestorIdx > highestSatisfiedLayer)
                            {
                                highestSatisfiedLayer = depthPredAncestorIdx;
                                highestSatisfiedEdge = std::make_pair(predAncestorIdx, ancestorIdx);
                            }
                        }
                    } 
                }
            }
            // Now update the case
            if (highestSatisfiedEdge.has_value())
            {
                visited[std::make_pair(startNodeIdx, endNodeIdx)] = true;
                
                parentChildSwitch[startNodeIdx].push_back(std::make_tuple(endNodeIdx, highestSatisfiedEdge.value().first, highestSatisfiedEdge.value().second));
            }
        } 
    }
}