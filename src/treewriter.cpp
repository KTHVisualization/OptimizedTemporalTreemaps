#include <treewriter.h>
#include <regex>

json TreeWritter::createJSON(std::shared_ptr<TemporalTree> tree, const TemporalTree::TTreeOrder &order, 
                            bool layoutComputed, 
                            bool orderDrawingEdge,
                            bool writeNodeName    
                        )
{
    // If we only have scalarValue: scalarValue will be both the width and scalar when writting
    // If we only have areaValue: areaValue will be the width, scalar will be the layer of the node
    // If we have both, each will do their things

    // orderDrawingEdge => put the edges in the layer = (depth(node1) + depth(node2)) / 2
    // Sometimes we also want to have the node name

    // Scale Factor for width, can be changed to a parameter layer
    const double scaleFactor = 1;
    // Small tolerance to consider the case where the value is zero
    const double tol = 1e-10;

    // json to store the final information
    json jFinal;

    json jNodes;
    json jEdgesHierarchy;
    json jEdgesTime;

    json jBirthNodes;
    json jDeathNodes;
    json jBirthDeathNodes;  // Mark nodes that are both born and death at the same time
    json jParentSwitch;

    // Assuming order is the given order of the leaves of this tree
    // Copy the given order to the tree order
    // tree->leavesOrder.insert(tree->leavesOrder.end(), order.begin(), order.end());
    // Get the order map
    TemporalTree::TTreeOrderMap orderMap;
    TreeOrder::toOrderMap(orderMap, order);

    // Add the time to the list of hierarcy
    for (auto &time : tree->times)
    {
        jEdgesHierarchy[std::to_string(time)] = json::object();
    }

    size_t level(0);
    std::vector<size_t> layerOrder;
    // Get the nodes of the layers from root to leaves
    std::vector<size_t> nodesLayer;
    nodesLayer = tree->getLevel(level, nodesLayer, 0);

    // We count how many nodes we have already written
    std::map<uint64_t, int> stacks;

    // Loop for each layer
    while (!nodesLayer.empty())
    {   
        // Get the order of this layer based on the leaves layer
        getLayerOrder(*tree.get(), orderMap, nodesLayer, layerOrder);

        // For each node in the sorted order
        for (const auto &nodeIdx : layerOrder)
        {
            // Get the information of the node
            TemporalTree::TNode &currNode = tree->nodes[nodeIdx];
            // Prepare stack
            if (!layoutComputed)
            {
                if (stacks.count(currNode.timeStep) == 0)
                    stacks[currNode.timeStep] = 0;

                // Update the layout of the node
                // This is just one instance
                // We can change this for more aethestically pleasing
                currNode.layout.x = currNode.timeStep;
                currNode.layout.y = stacks[currNode.timeStep];
                // If the layout is not given
                if (currNode.layout.width < 0 && currNode.areaValue.has_value())
                {
                    // Calculate the width case on the values
                    // The width base on area value * some scaler if it exists
                    currNode.layout.width = fabs(currNode.areaValue.value()) * scaleFactor + tol;
                }
                else if (currNode.layout.width < 0 && currNode.scalarValue.has_value())
                {
                    // Else if only scalar Value exists
                    currNode.layout.width = fabs(currNode.scalarValue.value()) * scaleFactor + tol;
                }

                // If not, the width will be -1 by default, we won't write the layout to the results
                // It should not happen, we expect the tree to have either scalarValue or areaValue
                stacks[currNode.timeStep]++;
            }

            // Node in json format
            json jSingleNode;

            jSingleNode["layer"] = level;
            jSingleNode["time"] = currNode.timeStep;

            if (currNode.scalarValue.has_value())
            {
                // If we have scalar value
                jSingleNode["scalar"] = currNode.scalarValue.value();
            }
            else
            {
                // It is required in this case that we have areaValue
                // Assign the scalar as the depth of the node
                jSingleNode["scalar"] = tree->depth(nodeIdx);
            }

            // If we have decided on the layout
            if (currNode.layout.width > 0)
            {
                jSingleNode["width"] = currNode.layout.width;

                json jLayout;

                jLayout["x"] = currNode.layout.x;
                jLayout["y"] = currNode.layout.y;
                jLayout["width"] = currNode.layout.width;

                jSingleNode["layout"] = jLayout;
            }

            if (writeNodeName)
            {
                jSingleNode["name"] = currNode.name;
            }

            // Add this node to the list of all nodes
            jNodes[std::to_string(nodeIdx)] = jSingleNode;

            // Add the temporal edges
            const auto &successors = tree->getTemporalSuccessors(nodeIdx);

            if (!successors.empty())
            {
                if (!orderDrawingEdge)
                {
                    std::vector<std::string> successorsStr;
                    successorsStr.resize(successors.size());
                    for (size_t i = 0; i < successors.size(); i++)
                    {
                        successorsStr[i] = std::to_string(successors[i]);
                    }
                    jEdgesTime[std::to_string(level)][std::to_string(nodeIdx)] = successorsStr;
                } else 
                {
                    // Get the depth of the first node
                    // const auto depthFromNode = tree->depth(nodeIdx);

                    // For each succesors, compute the depth of it and compare with the depthFromNode
                    // Save that into a map
                    std::map<float, std::vector<size_t>> layersToNodes;
                    layersToNodes.clear();

                    // The map contains float keys, we need a seperate vector for the normal case
                    std::vector<std::string> normalSuccessorsStr;
                    normalSuccessorsStr.reserve(successors.size() / 2);

                    for (const auto toNodeIdx : successors)
                    {
                        // Compute the depth
                        const auto depthToNode = tree->depth(toNodeIdx);

                        // If the depth are the same
                        if (depthToNode == level)
                        {
                            normalSuccessorsStr.push_back(std::to_string(toNodeIdx));
                        } else 
                        {
                            // There are in a different level
                            // Get the average layer between them
                            auto depthAvg = (depthToNode + level) / 2.;

                            // The depth can be an integer number, we may don't want this,
                            // Minus the depth by 0.1 
                            depthAvg = std::floor(depthAvg) == depthAvg ? depthAvg - 0.1 : depthAvg;
                            // Save it
                            layersToNodes[depthAvg].push_back(toNodeIdx);
                        }
                    }

                    // Loop for each key in the map
                    for (const auto& [layer, nodesList] : layersToNodes)
                    {
                        // Convert nodeList to Str
                        std::vector<std::string> successorsStr;
                        successorsStr.resize(nodesList.size());

                        // For each element of the nodesList
                        for (size_t i = 0; i < nodesList.size(); i++)
                        {
                            successorsStr[i] = std::to_string(nodesList[i]); 
                        }

                        // Write to the json
                        std::ostringstream oss;
                        oss << std::fixed << std::setprecision(1) << layer;
                        jEdgesTime[oss.str()][std::to_string(nodeIdx)] = successorsStr;
                    }
                    jEdgesTime[std::to_string(level)][std::to_string(nodeIdx)] = normalSuccessorsStr;
                }
            }

            // Add the hierarchy edges
            const auto &children = tree->getHierarchicalChildren(nodeIdx);

            if (!children.empty())
            {
                std::vector<std::string> childrenStr;
                childrenStr.resize(children.size());
                for (size_t i = 0; i < children.size(); i++)
                {
                    childrenStr[i] = std::to_string(children[i]);
                }
                jEdgesHierarchy[std::to_string(currNode.timeStep)][std::to_string(nodeIdx)] = childrenStr;
            }
        }

        // Move to the next level
        nodesLayer = tree->getLevel(level + 1, nodesLayer, level);

        level++;
    }

    

    // Extra fields
    // Check if we have scalar value
    // By checking the first node
    if (tree->nodes[0].scalarValue.has_value())
    {
        // If we only have scalarValue
        jFinal["maxScalar"] = tree->maxScalarValue;
        jFinal["minScalar"] = tree->minScalarValue;
    }
    else
    {
        // If We only have areaValue
        // We assigned the scalar as the layer of the node
        jFinal["maxScalar"] = (level - 1) * 1.;
        jFinal["minScalar"] = 0.;
    }

    jFinal["maxLayer"] = level - 1;

    // Dump vector to initialize/signify emptyness
    std::vector<size_t> dumpVector;
    dumpVector.clear();

    // There are a chance where jEdgesTime did not contain any edges
    // All nodes of that layer is both born and die at the same time
    // The viz code will not draw any of them
    // We must check for this and put jEdgesTime["missingLayer"] = dump vector
    // Loop from layer 0 to maxLayer
    for (size_t currLayer = 0; currLayer < level; currLayer++)
    {
        if (!jEdgesTime.contains(std::to_string(currLayer)))
        {
            jEdgesTime[std::to_string(currLayer)] = dumpVector;
        }

        // We also need to add the born dies layer here as well
        if (currLayer > 0)
        {
            std::ostringstream oss;
            oss << std::fixed << std::setprecision(1) << (currLayer - 0.9);
            jEdgesTime[oss.str()] = dumpVector;
        }
    }

    // Process extra drawing information
    std::set<size_t> birthNodes;
    std::set<size_t> deathNodes;
    std::map<size_t, std::vector<std::tuple<size_t, size_t, size_t>>> parentChildSwitch;
    tree->getSpecialEvents(birthNodes, deathNodes, parentChildSwitch);

    // Get the birth and death nodes
    std::vector<size_t> birthDeathNodes;
    birthDeathNodes.clear();
    std::set_intersection(birthNodes.begin(), birthNodes.end(),
                        deathNodes.begin(), deathNodes.end(),
                        std::back_inserter(birthDeathNodes));

    // Get the normal birth nodes
    std::vector<size_t> birthOnlyNodes;
    birthOnlyNodes.clear();
    std::set_difference(birthNodes.begin(), birthNodes.end(),
                        birthDeathNodes.begin(), birthDeathNodes.end(),
                        std::back_inserter(birthOnlyNodes));
    
    // Get the normal death nodes
    std::vector<size_t> deathOnlyNodes;
    deathOnlyNodes.clear();
    std::set_difference(deathNodes.begin(), deathNodes.end(),
                        birthDeathNodes.begin(), birthDeathNodes.end(),
                        std::back_inserter(deathOnlyNodes));

    for (size_t i = 0; i < level; i++)
    {

        if (i > 0)
        {
            std::ostringstream oss;
            oss << std::fixed << std::setprecision(1) << (i - 0.9);
            jBirthNodes[oss.str()] = dumpVector;
            jDeathNodes[oss.str()] = dumpVector;
            jBirthDeathNodes[oss.str()] = dumpVector;
        } else 
        {
            jBirthNodes[std::to_string(i)] = dumpVector;
            jDeathNodes[std::to_string(i)] = dumpVector;
            jBirthDeathNodes[std::to_string(i)] = dumpVector;
        }
        
        jParentSwitch[std::to_string(i)] = json::object();
    }

    // Loop through each birth-death events
    // We actually want to draw these elements below the other element
    // They should be only a bit higher than the previous layers 
    for (auto birthNodeIdx : birthOnlyNodes)
    {
        std::ostringstream oss;
        oss << std::fixed << std::setprecision(1) << (tree->depth(birthNodeIdx) - 0.9);
        jBirthNodes[oss.str()].push_back(std::to_string(birthNodeIdx));
    }

    for (auto deathNodeIdx : deathOnlyNodes)
    {
        std::ostringstream oss;
        oss << std::fixed << std::setprecision(1) << (tree->depth(deathNodeIdx) - 0.9);
        jDeathNodes[oss.str()].push_back(std::to_string(deathNodeIdx));
    }

    for (auto birthDeathNodeIdx : birthDeathNodes)
    {
        std::ostringstream oss;
        oss << std::fixed << std::setprecision(1) << (tree->depth(birthDeathNodeIdx) - 0.9);
        jBirthDeathNodes[oss.str()].push_back(std::to_string(birthDeathNodeIdx));
    }

    // Loop through the parent-child swith
    for (const auto &[startNode, allInfo] : parentChildSwitch)
    {
        std::vector<std::vector<std::string>> allInfoString;

        size_t newChildIdx(0);
        for (auto &info : allInfo)
        {
            std::vector<std::string> infoString;

            newChildIdx = std::get<0>(info);
            infoString.push_back(std::to_string(newChildIdx));

            infoString.push_back(std::to_string(std::get<1>(info)));
            infoString.push_back(std::to_string(std::get<2>(info)));

            allInfoString.push_back(infoString);
        }
        jParentSwitch[std::to_string(tree->depth(newChildIdx))][std::to_string(startNode)] = allInfoString;
    }


    // Get the temporal connections
    // std::vector<std::vector<std::string>> allTemporalPaths = tree->getAllTemporalPaths();
    
    // Combine to the final json
    jFinal["nodes"] = jNodes;
    jFinal["edgesHierarchy"] = jEdgesHierarchy;
    jFinal["edgesTime"] = jEdgesTime;

    jFinal["nodesBorn"] = jBirthNodes;
    jFinal["nodesDie"] = jDeathNodes;
    jFinal["nodesBornDie"] = jBirthDeathNodes;
    jFinal["edgesSwitchParentChild"] = jParentSwitch;

    // jFinal["temporalPaths"] = allTemporalPaths;

    return jFinal;
}

void TreeWritter::writeJSON(const json &jsonFile, const std::string &fileName)
{
    // Get filename and open file
    std::ofstream outFile;
    outFile.exceptions(std::ofstream::failbit | std::ofstream::badbit);
    try
    {
        outFile.open(fileName);
    }
    catch (const std::ofstream::failure &e)
    {
        std::clog << "File could not be opened: " << fileName;
        std::cerr << "Error Code: " << e.code() << "    . " << e.what() << "\n";
        return;
    }

    outFile << jsonFile.dump() << std::endl;

    outFile.close();
}

void TreeWritter::copyJSONtoJS(const json &jsonFile, const std::string &fieldName,
                               const std::string &jsBasePath)
{
    // Get filename and open file
    // Create the jsPath
    std::string jsPath = jsBasePath + fieldName + ".js";

    // We create a completely new js for each dataset
    std::string jsContent = "var " + fieldName + " = " + jsonFile.dump() + ";";

    // Write the content
    std::ofstream jsFileOut;
    jsFileOut.exceptions(std::ofstream::failbit | std::ostream::badbit);
    try 
    {
        jsFileOut.open(jsPath);
    }
    catch (const std::ofstream::failure& e)
    {
        std::clog << "File could not be opened: " << jsPath;
        std::cerr << "Error Code: " << e.code() << "    . " << e.what() << "\n";
        return;
    }
    jsFileOut << jsContent << std::endl;

    jsFileOut.close();

}

void TreeWritter::addDatasetOptionHTML(const std::string &fieldName, const std::string& fieldNameComp, const std::string &htmlPath)
{
    // Get filename and open file
    std::ifstream htmlFileIn;
    std::ostringstream htmlContentStream;

    htmlFileIn.exceptions(std::ifstream::failbit | std::ifstream::badbit);
    try
    {
        htmlFileIn.open(htmlPath);
        htmlContentStream << htmlFileIn.rdbuf();
        htmlFileIn.close();
    }
    catch (const std::ifstream::failure &e)
    {
        std::clog << "File could not be opened: ";
        std::cerr << "Error Code: " << e.code() << "    . " << e.what() << "\n";
        return;
    }

    std::string fileContent = htmlContentStream.str();
    // Find the <select> element by its id and insert the new <option>
    std::regex selectPattern(R"(<\s*select\s*id\s*=\s*"datasets"\s*>[\s\S]*?<\s*/select\s*>)");
    std::smatch match;
    if (std::regex_search(fileContent, match, selectPattern))
    {
        // Find the <select> tag and add the new <option> before closing
        std::string selectContent = match.str(0);

        // Prepare the <option> tag
        std::string newOption = "\t\t\t<option>" + fieldName + "</option>\n";

        // Insert it before </select>
        size_t insertPos = selectContent.rfind("</select>");
        if (insertPos != std::string::npos)
        {
            selectContent.insert(insertPos, newOption);
        }

        // Replace the old <select> with the updated one
        fileContent.replace(match.position(0), match.length(0), selectContent);
    }
    else
    {
        std::cerr << "Error: no <select id=\"datasets\"> found\n";
        return;
    }

    // Find the <body> elements by its id an insert the script option
    size_t pos = fileContent.find("<body>");
    if (pos != std::string::npos)
    {
        // Move pass body
        pos += 6;
        const std::string scriptImport = "\n<script src=data/" + fieldName + ".js></script>";
        fileContent.insert(pos, scriptImport);
    }
    else 
    {
        std::cerr << "Error: <body> tag not found\n";
        return; 
    } 

    if (fieldNameComp != "")
    {
        std::regex selectPatternComp(R"(<\s*select\s*id\s*=\s*"datasets-2"\s*>[\s\S]*?<\s*/select\s*>)");
        std::smatch matchComp;
        if (std::regex_search(fileContent, matchComp, selectPatternComp))
        {
            // Find the <select> tag and add the new <option> before closing
            std::string selectContentComp = matchComp.str(0);

            // Prepare the <option> tag
            std::string newOptionComp = "\t\t\t<option>" + fieldNameComp + "</option>\n";

            // Insert it before </select>
            size_t insertPosComp = selectContentComp.rfind("</select>");
            if (insertPosComp != std::string::npos)
            {
                selectContentComp.insert(insertPosComp, newOptionComp);
            }

            // Replace the old <select> with the updated one
            fileContent.replace(match.position(0), match.length(0), selectContentComp);
        }
        else
        {
            std::cerr << "Error: no <select id=\"datasets\"> found\n";
            return;
        }

        // Find the <body> elements by its id an insert the script option
        size_t posComp = fileContent.find("<body>");
        if (posComp != std::string::npos)
        {
            // Move pass body
            pos += 6;
            const std::string scriptImportComp = "\n<script src=data/" + fieldNameComp + ".js></script>";
            fileContent.insert(pos, scriptImportComp);
        }
        else 
        {
            std::cerr << "Error: <body> tag not found\n";
            return; 
        }
    }

    // Remove trailing space at the end of the filecontent
    fileContent.erase(std::find_if(fileContent.rbegin(), fileContent.rend(), [](unsigned char ch){
        return !std::isspace(ch);
    }).base(), fileContent.end());

    // Write the modelf back
    std::ofstream htmlFileOut;

    htmlFileOut.exceptions(std::ofstream::failbit | std::ofstream::badbit);
    try
    {
        htmlFileOut.open(htmlPath);
    }
    catch (const std::ofstream::failure &e)
    {
        std::clog << "File could not be opened: " << htmlPath;
        std::cerr << "Error Code: " << e.code() << "    . " << e.what() << "\n";
        return;
    }
    htmlFileOut << fileContent << std::endl;

    htmlFileOut.close();
}

void TreeWritter::getLayerOrder(const TemporalTree &tree, const TemporalTree::TTreeOrderMap &leavesOrderMap,
                                const std::vector<size_t> &nodesLayer, std::vector<size_t> &layerOrder)
{
    layerOrder.clear();
    // Prepare the memory
    const size_t numLeaves = leavesOrderMap.size();
    if (numLeaves == 0)
        return;

    // For the sorting of the parents
    std::vector<std::pair<size_t, size_t>> parentAndFirstLeaf;
    parentAndFirstLeaf.reserve(nodesLayer.size());

    // For each parent
    for (const size_t nodeIdx : nodesLayer)
    {
        // Get all leave of this parent
        std::vector<size_t> leavesOfParent;

        leavesOfParent = tree.computeLeafDescendants(nodeIdx);
        // If the node has a leaf children
        if (leavesOfParent.size() > 0)
        {
            // Find the first leaf according to the given order
            size_t minLeafOrder(numLeaves);

            for (const size_t &leafIdx : leavesOfParent)
            {
                
                // If the order map is not given properly
                if (leavesOrderMap.count(leafIdx) == 0)
                {
                    std::cout << "Leaf " << leafIdx << " not found! Ancestor is " << nodeIdx << "\n";
                    continue;
                }

                const size_t leafOrder = leavesOrderMap.at(leafIdx);
                minLeafOrder = leafOrder < minLeafOrder ? leafOrder : minLeafOrder;
            }
            // Add it to the sorting vector
            parentAndFirstLeaf.push_back(std::make_pair(nodeIdx, minLeafOrder));
        }
        else
        {
            // This is a leaf
            parentAndFirstLeaf.push_back(std::make_pair(nodeIdx, leavesOrderMap.at(nodeIdx)));
        }
    }
    // Now sort the parent according to the first child in by the given order
    std::sort(parentAndFirstLeaf.begin(), parentAndFirstLeaf.end(),
              [&](const auto &a, const auto &b)
              { return a.second < b.second; });

    // Make this to a layer of the layer
    const size_t numEle = parentAndFirstLeaf.size();
    layerOrder.resize(numEle);

    for (size_t i = 0; i < numEle; i++)
    {
        layerOrder[i] = parentAndFirstLeaf[i].first;
    }
}