#pragma once

#include <memory>
#include <datastructures/tree.h>

#include "util.h"


class TemporalTreeJSONReader
{
public:

    std::shared_ptr<TemporalTree> readData(const std::string& filePath);

protected:
    void readEdges(const json& j, const std::string& name, TemporalTree& tree);
};