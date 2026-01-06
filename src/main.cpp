#include <datastructures/tree.h>
#include <treejsonreader.h>
#include <treeorder.h>
#include <treewriter.h>
#include <wigglemin.h>
#include <fstream>

char* getCmdOption(char** begin, char** end, const std::string& option)
{
    char **it = std::find(begin, end, option);
    if (it != end && ++it != end)
    {
        return *it;
    }
    return 0;
}

bool isCmdOptionExists(char** begin, char** end, const std::string& option)
{
    return std::find(begin, end, option) != end;
}

int main(int argc, char* argv[])
{
    std::string fileIn = getCmdOption(argv, argv + argc, "-fin");
    std::string fileIn2;

    // Get options
    bool isFileOut = isCmdOptionExists(argv, argv + argc, "-fout");
    bool isFileOut2 = isCmdOptionExists(argv, argv + argc, "-fout2");
    bool isILP = isCmdOptionExists(argv, argv + argc, "-ILP");
    bool isMedian = isCmdOptionExists(argv, argv + argc, "-Median");
    bool isCopyToJS = isCmdOptionExists(argv, argv + argc, "-copy");
    bool isCopyToJSCompFile1 = isCmdOptionExists(argv, argv + argc, "-copycomp1");
    bool isCopyToJSCompFile2 = isCmdOptionExists(argv, argv + argc, "-copycomp2");
    bool isWiggleMinL = isCmdOptionExists(argv, argv + argc, "-wiggleminL");
    bool isWiggleMinQ = isCmdOptionExists(argv, argv + argc, "-wiggleminQ");
    bool isWeighted = isCmdOptionExists(argv, argv + argc, "-weighted");
    bool verbose = isCmdOptionExists(argv, argv + argc, "-v");
    bool symmetric = isCmdOptionExists(argv, argv + argc, "-symmetric");
    bool isPercentPadding = isCmdOptionExists(argv, argv + argc, "-percentpadding");
    bool isPercentPaddingUsed = isCmdOptionExists(argv, argv + argc, "-percentpaddingused");
    bool isThreads = isCmdOptionExists(argv, argv + argc, "-numthreads");
    bool isComparison = isCmdOptionExists(argv, argv + argc, "-comparison");
    bool isComparisionDiff = isCmdOptionExists(argv, argv + argc, "-comparisondiff");
    bool isIgnoreRootForWiggleMinimization = isCmdOptionExists(argv, argv + argc, "-ignoreroot");
    bool isOnlyLeaves = isCmdOptionExists(argv, argv + argc, "-onlyleaves");
    int numthreads = 1;
    if (isThreads) {
        std::string numthreadsstr = getCmdOption(argv, argv + argc, "-numthreads");
        numthreads = std::stoi(numthreadsstr);
    }
    double percentpadding = 0.2;
    if (isPercentPadding) {
        std::string percentpaddingstr = getCmdOption(argv, argv + argc, "-percentpadding");
        percentpadding = std::stod(percentpaddingstr) / 100;
    }
    double percentpaddingused = 0.7;
    if (isPercentPaddingUsed)
    {
        std::string percentpaddingusedstr = getCmdOption(argv, argv + argc, "-percentpaddingused");
        percentpaddingused = std::stod(percentpaddingusedstr)/100;
    }

    bool isDrawEdgeBarycentric = isCmdOptionExists(argv, argv + argc, "-barycenteredges");
    bool isWriteNodeNames = isCmdOptionExists(argv, argv + argc, "-nodenames");

    TemporalTreeJSONReader reader;
    auto temporalTree = reader.readData(fileIn);

    if (verbose) {
        std::cout<<"Number of nodes: "<<temporalTree->nodes.size()<<std::endl;
        std::cout<<"Number of hierarchical edges: "<<temporalTree->getNumHierarchicalEdges()<<std::endl;
        std::cout<<"Number of temporal edges: "<<temporalTree->getNumTemporalEdges()<<std::endl;
        std::cout<<"Number of time steps: "<<temporalTree->times.size()<<std::endl;
    }
        

    std::shared_ptr<TemporalTree> temporalTree2;
    if (isComparison || isComparisionDiff)
    {
        fileIn2 = getCmdOption(argv, argv + argc, "-fin2");
        TemporalTreeJSONReader reader2;
        temporalTree2 = reader2.readData(fileIn2);
        temporalTree2->computeReverseEdges();
    }

    temporalTree->computeReverseEdges();
    auto start = std::chrono::high_resolution_clock::now();
    std::vector<size_t> order;
    std::vector<size_t> order2;
    if (isILP)
    {
        if (isComparison) TreeOrder::orderGurobiCrossingMinimizationComp(order, *temporalTree, *temporalTree2, verbose, numthreads);
        if (isComparisionDiff) TreeOrder::orderGurobiCrossingMinimizationCompFixFirst(order, order2, *temporalTree, *temporalTree2, verbose, numthreads);
        else TreeOrder::orderGurobiCrossingMinimization(order, *temporalTree, verbose, numthreads);
    }
    else if(isMedian)
    {
        if (isComparison || isComparisionDiff) assert(false);
        TreeOrder::orderMedianCrossingMinimization(order, *temporalTree);
    }
    else 
    {
        if (isComparison || isComparisionDiff) assert(false);
        TreeOrder::orderAsInserted(order, *temporalTree);
    }
    auto end = std::chrono::high_resolution_clock::now();
    if (verbose) {
        std::cout << "Time crossing minimization: " << std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count() << "ms" << std::endl;
    }
    temporalTree->leavesOrder = order;
    if (isComparisionDiff) temporalTree2->leavesOrder = order2;
    if (verbose)
        std::cout<<"Number of crossings: "<<TreeOrder::countCrossings(*temporalTree)<<std::endl;
    if (isComparison) {
        temporalTree2->leavesOrder = order;
        if (verbose)
            std::cout<<"Number of crossings tree 2: "<<TreeOrder::countCrossings(*temporalTree2)<<std::endl;
    }

    start = std::chrono::high_resolution_clock::now();
    if (isWiggleMinL || isWiggleMinQ)
    {
        if (isComparison)
            WiggleMin::minimizeWigglesComp(*temporalTree, *temporalTree2, verbose, isWeighted, isWiggleMinQ, symmetric, percentpadding, percentpaddingused, numthreads, isIgnoreRootForWiggleMinimization, isOnlyLeaves);
        else if (isComparisionDiff)
        {
            WiggleMin::minimizeWigglesCompFixFirst(*temporalTree, *temporalTree2, verbose, isWeighted, isWiggleMinQ, symmetric, percentpadding, percentpaddingused, numthreads, isIgnoreRootForWiggleMinimization, isOnlyLeaves);
        }
        else
            WiggleMin::minimizeWiggles(*temporalTree, verbose, isWeighted, isWiggleMinQ, symmetric, percentpadding, percentpaddingused, numthreads, isIgnoreRootForWiggleMinimization, isOnlyLeaves);
    }    
    end = std::chrono::high_resolution_clock::now();
    if (verbose) {
        std::cout << "Time wiggle minimization: " << std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count() << "ms" << std::endl;
    }

    json jsonFile;
    TreeWritter writter;
    json jsonFile2;
    TreeWritter writter2;

    // Write to json
    jsonFile = writter.createJSON(temporalTree, order, isWiggleMinL || isWiggleMinQ, isDrawEdgeBarycentric, isWriteNodeNames);
    // for (auto root: temporalTree->getRoots()) {
    //     std::cout<<temporalTree->nodes[root].layout.width<<" " << temporalTree->nodes[root].layout.y <<" "<<temporalTree->nodes[root].layout.x <<std::endl;
    // }

    if (isFileOut)
    {
        std::string fileOut = getCmdOption(argv, argv + argc, "-fout");
        writter.writeJSON(jsonFile, fileOut);
    }

    if ((isFileOut2 || isCopyToJSCompFile2))
    {
        if (isComparison && !isComparisionDiff)
            jsonFile2 = writter2.createJSON(temporalTree2, order, isWiggleMinL || isWiggleMinQ, isDrawEdgeBarycentric, isWriteNodeNames);
        else if (!isComparison && isComparisionDiff)
            jsonFile2 = writter2.createJSON(temporalTree2, order2, isWiggleMinL || isWiggleMinQ, isDrawEdgeBarycentric, isWriteNodeNames);
        if (isFileOut2)
        {
            std::string fileOut2 = getCmdOption(argv, argv + argc, "-fout2");
            writter2.writeJSON(jsonFile2, fileOut2);
        }
    }



    
    if (isCopyToJS)
    {
        std::string fieldName = getCmdOption(argv, argv + argc, "-copy");
        std::string jsBasePath = "../visualization/data/";
        std::string htmlPath = "../visualization/index.html";
        writter.copyJSONtoJS(jsonFile, fieldName, jsBasePath);
        writter.addDatasetOptionHTML(fieldName, "", htmlPath);
    }

    if (isCopyToJSCompFile1 && isCopyToJSCompFile2)
    {
        std::string fieldName1 = getCmdOption(argv, argv + argc, "-copycomp1");
        std::string fieldName2 = getCmdOption(argv, argv + argc, "-copycomp2");
        std::string jsBasePath = "../visualization/data_compare/";
        std::string htmlPath = "../visualization/compare.html";
        writter.copyJSONtoJS(jsonFile, fieldName1, jsBasePath);
        writter.copyJSONtoJS(jsonFile2, fieldName2, jsBasePath);
        // writter.addDatasetOptionHTML(fieldName1, fieldName2, htmlPath);
    }

    return 0;
}