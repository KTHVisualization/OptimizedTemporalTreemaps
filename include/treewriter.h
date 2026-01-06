#include <datastructures/tree.h>
#include <treeorder.h>
#include <util.h>
#include <fstream> 

class TreeWritter
{
public:
    json createJSON(std::shared_ptr<TemporalTree> tree, const TemporalTree::TTreeOrder& order, 
                    bool layoutComputed, 
                    bool orderDrawingEdges,
                    bool writeNodeName
                );

    void writeJSON(const json& jsonFile, const std::string& fileName);

    void copyJSONtoJS(const json& jsonFile, const std::string& fieldName, const std::string& jsPath = "../visualization/lib/exampleTrees.js");
    void addDatasetOptionHTML(const std::string& fieldName, const std::string& fieldNameComp="", const std::string& htmlPath = "../visualization/index.html");

protected:
    void getLayerOrder(const TemporalTree& tree, const TemporalTree::TTreeOrderMap& leavesOrderMap,
                    const std::vector<size_t>& nodesLayer, std::vector<size_t>& layerOrder);
};
