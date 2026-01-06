#pragma once
#include "util.h"
#include <cfloat>
#include <queue>


/** \class TemporalTree
    \brief Describes a tree data structure with time-dependent values at the nodes.

    @author Tino Weinkauf and Wiebke Köpp
*/

class TemporalTree
{
    // Typedefs
public:

    // Layout for the each node
    // Consists of (x,y): center of the node
    // and width
    struct NLayout
    {
        double x;
        double y;
        double width;

        // Simple constructor
        NLayout() : x(0.), y(0.), width(-1.) {}

        // Element constructor
        NLayout(const double x_,
                const double y_,
                const double width_) 
            : x(x_), y(y_), width(width_) {}
    };

    // Single node in a time-dependent tree. Can be inner node or leaf.
    struct TNode
    {
        // Name for some application
        std::string name;
        // Deaggregated tree
        // Node has value for one timestep only
        // Timestep 
        uint64_t timeStep;

        // Index of the parent of this node
        // nullopt if node has no parent
        std::optional<size_t> parentIdx;

        // Value of the node at the discrete time points
        // We consider one specific value at a time
        // We support 2 types of value for each node
        // AreaValue and ScalarValue
        // areaValue: the area of which this node covered
        // scalarValue: the scalar value this node holds, can be isovalue/persistence
        std::optional<double> areaValue;
        std::optional<double> scalarValue;

        NLayout layout;

        // Node Id, for further applications
        size_t id;
        
        // Simple constructor
        TNode() : name(""), timeStep(0), parentIdx(std::nullopt), areaValue(std::nullopt), scalarValue(std::nullopt), layout(), id(0) {}

        // Element constructor
        TNode(  const std::string& name_,
                const uint64_t timeStep_, 
                const std::optional<double> areaValue_ = std::nullopt, 
                const std::optional<double> scalarValue_ = std::nullopt,
                const double x_ = -1.,
                const double y_ = -1.,
                const double width_ = -1.)
            : name(name_)
            , timeStep(timeStep_)
            , parentIdx(std::nullopt)
            , areaValue(areaValue_)
            , scalarValue(scalarValue_)
            , layout(x_, y_, width_)
            , id(0) 
        {
    
        }

        void setParentIdx(size_t idx) 
        {
            parentIdx = idx;
        }

    };
    
    // Type of the edges
    typedef std::map<size_t, std::vector<size_t>> TAdjacency;

    // Encodes a sorting of the leaves of a TemporalTree for each timestep
    using TTreeOrder = std::vector<size_t>;

    // Maps a leaf index to its order index
    using TTreeOrderMap = std::map<size_t, size_t>;

    //Attributes
public:
    // Nodes of the tree
    // First node is the root
    std::vector<TNode> nodes;

    // Hierarchical edges
    TAdjacency edgesHierarchy;

    // Cache for reverse hierarchy edges
    TAdjacency reverseEdgesHierarchy;

    // Temporal edges
    // Considering the de-aggregated version
    // It should be strictly connecting between 2 consecutive time steps
    TAdjacency edgesTime;

    // Cache for reverse temporal edges
    TAdjacency reverseEdgesTime;

    // Order on the leaves of this tree
    TTreeOrder leavesOrder;

    // Extra information for fast retrieving
    std::set<uint64_t> times;
    size_t maxLayer;

    double minAreaValue;
    double maxAreaValue;

    double minScalarValue;
    double maxScalarValue;

    // Constructor/Destructor
public:
    TemporalTree() 
        : minAreaValue(FLT_MAX), maxAreaValue(-FLT_MAX), minScalarValue(FLT_MAX), maxScalarValue(-FLT_MAX) {
            this->times = {};
        }
    virtual ~TemporalTree() = default;

    // Methods
    /** @name Extending the Tree

            Utility functions for extending the tree and adding data to it.
    */
    //@{
public:

    /* Add a node to the tree
        @returns the index of the newly created node
    */
    size_t addNode(const TNode& node);

    /* Add a node to the tree, given by parameters 
        @returns the index of the newly created node
    */
    size_t addNode(const std::string& name,
                    const uint64_t timeStep, 
                    const double areaValues,
                    const double scalarValues);

    // Add anode the the tree given by the parent and the parameter
    // Return the index of the newly created node
    size_t addChild(const size_t parent, const std::string& name,
                    const double areaValues,
                    const double scalarValues);

    // Add data values to a node
    void addTimeStep(const size_t nodeIdx, const uint64_t time);
    void addScalarValue(const size_t nodeIdx, const double dataValue);
    void addAreaValue(const size_t nodeIdx,  const double areaValue);


    // Add a hierarchical edge to the tree
    void addHierarchyEdge(const size_t from, const size_t to);

    // Add a temporal edge to the tree
    void addTemporalEdge(const size_t from, const size_t to);

    // Add layout information to the node
    void addLayout(const size_t nodeIdx, const double x_, const double y_, const double width_);

    void addId(const size_t nodeIdx, const size_t explicitNodeIdx);
    //@}

public:
    /**  @name Acces to elements of the tree
        * Getters to access parts of the tree 
    */

    // Get the indices for all nodes of a given level
    // Level 0 corresponds to the root node
    // Optionally give nodes of a previous level and previous level to avoid recomputation
    std::vector<size_t> getLevel(const size_t level, const std::vector<size_t>& prevLevelIdx,
                                const size_t prevLevel) const;
    
    // Return the number of levels from the given node down to the lowest leaf
    // Return 0 if this node is a leaf
    size_t getNumLevels(const size_t nodeIdx) const;

    // Get all leaf nodes of the trees
    std::vector<size_t> getLeaves() const;

    // Return all roots of the trees
    std::vector<size_t> getRoots() const;

    // Get all inner nodes of the trees
    std::vector<size_t> getInners() const;

    // Get all leaf given a time step
    std::vector<size_t> getLeavesTimestep(const uint64_t timeStep) const;

    // Get root of the tree a time step
    std::vector<size_t> getRootTimestep(const uint64_t timeStep) const;

    // Get inner nodes of a given time step
    std::vector<size_t> getInnersTimestep(const uint64_t timeStep) const;

    // Get all nodes of a given level at a time step
    std::vector<size_t> getLevelTimestep(const size_t level, const uint64_t timeStep,
                                        const std::vector<size_t>& prevLevelIdx, const size_t prevLevel) const;

    // Get all nodes of a given time step
    std::vector<size_t> getNodesTimeStep(const uint64_t timeStep) const;

    // Check if the node is a leaf or not
    bool isLeaf(const size_t nodeIdx) const 
    {
        return (edgesHierarchy.find(nodeIdx) == edgesHierarchy.end() || edgesHierarchy.at(nodeIdx).size() == 0);
    }

    bool isRoot(const size_t nodeIdx) const
    {
        return (nodes[nodeIdx].parentIdx == std::nullopt);
    }

    // Return the depth of a node
    size_t depth(const size_t nodeIdx) const;

    size_t getMaxLevel() {
        size_t mx = 0;
        for (size_t n = 0; n < nodes.size(); n++) {
            mx = std::max(mx, getNumLevels(n));
        }
        return mx + 1;
    }

    // Get the temporal succesors of a node from its index
    std::vector<size_t> getTemporalSuccessors(const size_t nodeIdx) const;

    // Get the temporal predecessors of a node from its index
    std::vector<size_t> getTemporalPredecessors(const size_t nodeIdx) const;

    std::vector<size_t> getHierarchicalParents(const size_t nodeIdx) const;
    std::vector<size_t> getHierarchicalChildren(const size_t nodeIdx) const;

    // Get the the hierarchy ancestors and descendants of a node from its index
    void getHierarchicalAncestors(const size_t nodeIdx, std::vector<size_t>& ancestors) const;
    void getHierarchicalDescendants(const size_t nodeIdx, std::vector<size_t>& descendants) const;
    

    // Get born nodes
    std::vector<size_t> getBornNodes(bool isGetFirstTimestep);

    std::vector<size_t> getDieNodes(bool isGetLastTimestep);

    // Get number of edges in the given set of edges
    size_t getNumEdges(const TAdjacency& edges) const;

    // Get number of hierarchical edges
    size_t getNumHierarchicalEdges() const 
    {
        return getNumEdges(edgesHierarchy);
    }

    // Get number of temporal edges
    size_t getNumTemporalEdges() const
    {
        return getNumEdges(edgesTime);
    }

    // Get the reverse map for the edges
    std::map<size_t, std::vector<size_t>> getReverseEdges(const TAdjacency& edges) const;

    // Compute reverse edge
    void computeReverseEdges()
    {
        reverseEdgesTime = getReverseEdges(edgesTime);
        reverseEdgesHierarchy = getReverseEdges(edgesHierarchy);
    }

    // Sort vector of indices by time in ascending order
    void sortByTime(std::vector<size_t>& nodeIdxs) const;

    // Sort vector of indices by time in descending order
    void sortByTimeBackward(std::vector<size_t>& nodeIdxs) const;

    std::vector<size_t> computePreorderIndex() const;

    std::vector<size_t> computePostOrderIndex() const;

    std::vector<size_t> computeNodeToSomeLeafDescendant() const;

    std::vector<size_t> computeLeafDescendants(size_t nodeIdx) const;

    

protected:
    // Get the edges pointing away from node
    std::vector<size_t> getEdgesFrom(const size_t nodeIdx, const TAdjacency& edges) const;

    // Get the edges pointing to a node
    std::vector<size_t> getEdgesTo(const size_t nodeIdx, const TAdjacency& edges) const;



    //}


    /** @name Misc
    */
    //@{
public:
    // Get all special events from the tree
    // Including birth-death events 
    // And parent-child switch events
    void getSpecialEvents(std::set<size_t>& birthNodes, std::set<size_t>& deathNodes, 
                        std::map<size_t, std::vector<std::tuple<size_t, size_t, size_t>>>& parentChildSwitch
                        );


    // Build all paths from the first timestep and all born nodes
    std::vector<std::vector<std::string>> getAllTemporalPaths();

protected:
    
    // BFS search from a startNodes
    std::vector<std::string> getTemporalPath(const size_t startNodeIdx, 
                                            const std::vector<size_t>& listBornNodes,
                                            const std::vector<size_t>& listDieNodes);


    // Helper methods to process the parent-child switching cases
    void processParentChildSwitch(const size_t startNodeIdx, const std::vector<size_t>& endNodesIdx, 
                        std::map<size_t, std::vector<std::tuple<size_t, size_t, size_t>>>& parentChildSwitch,
                        std::map<std::pair<size_t, size_t>, bool>& visited
                        ) const;
};