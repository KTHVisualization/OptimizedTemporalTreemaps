#include <treejsonreader.h>
#include <fstream>
#include <stdexcept>

std::shared_ptr<TemporalTree> TemporalTreeJSONReader::readData(const std::string& filePath)
{
    // Check if the file exists
    if (!std::filesystem::exists(filePath))
    {
        throw std::runtime_error("File does not exists!");
    }

    // Open the file
    std::ifstream inFile;

    try {
        inFile.open(filePath);
    } catch (const std::ifstream::failure& error)
    {
        throw std::runtime_error("Failed to open file");
    }

    // Read the file content
    json j;
    inFile >> j;

    // Close the file
    inFile.close();

    // Parse the content of the file and create a temporal tree
    auto temporalTree = std::make_shared<TemporalTree>();

    // Read the nodes
    if (j.cend() != j.find("nodes"))
    {
        const json& jNodes = j["nodes"];

        for (json::const_iterator it = jNodes.cbegin(); it != jNodes.cend(); it++)
        {
            // Add the nodes with its name
            const std::string name = (*it)["name"];
            // Extract the timeStep
            const uint64_t time = (*it)["timeStep"];
            
            TemporalTree::TNode newNode(name, time);
            auto newNodeIdx = temporalTree->addNode(newNode);
            // Update the time
            temporalTree->times.insert(time);
            
            // Add the data value for the nodes
            // The nodes can have either of the 2 supported values
            if ((*it).contains("areaValues"))
            {
                // If areaValues exists
                const double areaValue = (*it)["areaValues"];
                temporalTree->addAreaValue(newNodeIdx, areaValue);

                // Update the min-max areaValues;
                temporalTree->minAreaValue = areaValue < temporalTree->minAreaValue ? areaValue : temporalTree->minAreaValue;
                temporalTree->maxAreaValue = areaValue > temporalTree->maxAreaValue ? areaValue : temporalTree->maxAreaValue;
                
            }

            if ((*it).contains("scalarValues"))
            {
                // If scalarValues exists     
                const double scalarValue = (*it)["scalarValues"];
                temporalTree->addScalarValue(newNodeIdx, scalarValue);

                // Update the min-max scalarValue
                temporalTree->minScalarValue = scalarValue < temporalTree->minScalarValue ? scalarValue : temporalTree->minScalarValue;
                temporalTree->maxScalarValue = scalarValue > temporalTree->maxScalarValue ? scalarValue : temporalTree->maxScalarValue;
            }   

            // Read the layout if exists
            if ((*it).contains("layout"))
            {
                const json& jLayout = (*it)["layout"];
                const double x = jLayout["x"];
                const double y = jLayout["y"];
                const double width = jLayout["width"];

                temporalTree->addLayout(newNodeIdx, x, y, width); 
            }
            // Read the id if exists
            if ((*it).contains("id"))
            {
                const int explicitNodeId = (*it)["id"];
                temporalTree->addId(newNodeIdx, explicitNodeId);
            }
        }
    }

    // Read the edges
    readEdges(j, "edgesHierarchy", *temporalTree);
    readEdges(j, "edgesTime", *temporalTree);

    return temporalTree;
}

void TemporalTreeJSONReader::readEdges(const json& j, const std::string& name, TemporalTree& tree)
{
    // If name exists
    if (j.contains(name))
    {
        const json& jEdges = j[name];

        // For every 
        for (json::const_iterator it = jEdges.cbegin(); it != jEdges.cend(); it++)
        {
            const size_t keyVal = (*it)[0];
            const std::vector<size_t> mappedValues = (*it)[1];

            if (name == "edgesHierarchy")
            {
                for (auto& toIdx: mappedValues)
                {
                    tree.addHierarchyEdge(keyVal, toIdx);
                }
            }
            else 
            {
                for (auto& toIdx: mappedValues)
                {
                    tree.addTemporalEdge(keyVal, toIdx);
                }
            }
        }
    }
}