#include "wigglemin.h"
#include <gurobi_c++.h>

namespace WiggleMin
{

    void computeWidths(TemporalTree &tree, size_t node, double paddingpercent)
    {
        if (tree.isLeaf(node))
        {
            tree.nodes[node].layout.width = tree.nodes[node].areaValue.value() / 2;
        }
        auto children = tree.edgesHierarchy[node];
        for (auto child : children)
        {
            computeWidths(tree, child, paddingpercent);
        }
        double totalwidth = 0;
        for (auto child : children)
        {
            totalwidth += tree.nodes[child].layout.width * 2;
        }
        totalwidth = totalwidth * paddingpercent;
        if (tree.nodes[node].areaValue.value() < totalwidth)
        {
            tree.nodes[node].layout.width = totalwidth / 2;
        }
        else
        {
            tree.nodes[node].layout.width = tree.nodes[node].areaValue.value() / 2;
        }
    }

    // Use the indices of the tree as the order directly
    void minimizeWiggles(TemporalTree &tree, bool verbose, bool weighted, bool quadratic, bool symmetric, double percentpadding, double percentpaddingused, int threads, bool isIgnoreRootForWiggleMinimization, bool isOnlyLeaves)
    {
        assert(tree.leavesOrder.size() == tree.getLeaves().size());
        // auto starttime = std::chrono::high_resolution_clock::now();

        double paddingpercent = 1 + percentpadding;
        double viewportwidth = 15;
        double viewportheight = 4;

        for (auto node : tree.nodes)
        {
            assert(node.areaValue.has_value());
        }
        double maxheight = 0;
        double maxx = 0;
        for (auto root : tree.getRoots())
        {
            computeWidths(tree, root, paddingpercent);
            maxheight = std::max(maxheight, tree.nodes[root].layout.width * 2);
            maxx = std::max(maxx, (double)tree.nodes[root].timeStep);
        }
        double scaley = viewportheight / maxheight;
        double scalex = viewportwidth / maxx;

        for (auto &node : tree.nodes)
        {
            node.layout.width *= scaley;
        }

        GRBEnv env(true);
        env.set(GRB_IntParam_Threads, threads);
        if (!verbose)
            env.set(GRB_IntParam_OutputFlag, 0);
        env.set(GRB_DoubleParam_MemLimit, 8);
        env.start();
        GRBModel model(env);
        auto nodeToSomeLeafDescendant = tree.computeNodeToSomeLeafDescendant();
        std::unordered_map<size_t, size_t> orderIndex;
        for (size_t i = 0; i < tree.leavesOrder.size(); i++)
        {
            orderIndex[tree.leavesOrder[i]] = i;
        }
        std::vector<GRBVar> yvars;
        for (size_t i = 0; i < tree.nodes.size(); i++)
        {
            auto node = tree.nodes[i];
            double miny = tree.nodes[i].layout.width;
            yvars.push_back(model.addVar(miny, GRB_INFINITY, 0, GRB_CONTINUOUS, "y_" + std::to_string(i)));
        }

        if (symmetric)
        {
            for (auto root : tree.getRoots()) {
                if (tree.edgesTime.find(root) != tree.edgesTime.end() && tree.edgesTime[root].size() == 1) {
                    model.addConstr(yvars[root] == yvars[tree.edgesTime[root][0]]);
                }
            }
        }

        // constraints imposed by hierarchy
        for (size_t i = 0; i < tree.nodes.size(); i++)
        {
            auto parentnode = tree.nodes[i];
            if (tree.isLeaf(i))
            {
                continue;
            }            
            else
            {
                auto descendants = tree.edgesHierarchy[i];
                double sumwidth = 0;
                for (auto descendant : descendants)
                {
                    sumwidth += tree.nodes[descendant].layout.width * 2;
                }
                double padding = parentnode.layout.width*2 - sumwidth;
                padding = (padding * percentpaddingused) / (descendants.size() + 1);
                std::sort(descendants.begin(), descendants.end(), [&](size_t a, size_t b) -> bool
                          { return orderIndex[nodeToSomeLeafDescendant[a]] < orderIndex[nodeToSomeLeafDescendant[b]]; });

                for (size_t j = 0; j < descendants.size() - 1; j++)
                {
                    auto nbottom = descendants[j];
                    auto ntop = descendants[j + 1];
                    model.addConstr(yvars[ntop] - yvars[nbottom] >= tree.nodes[ntop].layout.width + tree.nodes[nbottom].layout.width + padding);
                }
                auto nbottom = descendants[0];
                auto ntop = descendants[descendants.size() - 1];
                auto upperborder = yvars[i] + parentnode.layout.width;
                auto lowerborder = yvars[i] - parentnode.layout.width;
                if (!(isIgnoreRootForWiggleMinimization && tree.isRoot(i)))
                {
                    model.addConstr(upperborder - yvars[ntop] >= tree.nodes[ntop].layout.width + padding);
                    model.addConstr(yvars[nbottom] - lowerborder >= tree.nodes[nbottom].layout.width + padding);
                }
                
            }
        }

        GRBQuadExpr objqdr = 0;
        GRBLinExpr objlin = 0;
        // absolute value objective
        for (size_t i = 0; i < tree.nodes.size(); i++)
        {
            if (isIgnoreRootForWiggleMinimization && tree.isRoot(i))
            {
                continue;
            }
            if (tree.edgesTime.find(i) != tree.edgesTime.end())
            {
                for (auto succ : tree.edgesTime[i])
                {
                    if (isOnlyLeaves && !tree.isLeaf(succ) && !tree.isLeaf(i))
                    {
                        continue;
                    }
                    GRBVar slopevar;
                    auto c = tree.nodes[i].layout.width + tree.nodes[succ].layout.width;
                    if (quadratic) {
                        slopevar = model.addVar(-GRB_INFINITY, GRB_INFINITY, 0, GRB_CONTINUOUS);
                        model.addConstr(slopevar == (yvars[succ] - yvars[i]));
                        if (weighted)
                        {
                            objqdr += slopevar * slopevar * c;
                        }
                        else
                        {
                            objqdr += slopevar * slopevar;
                        }   
                    }
                    else {
                        slopevar = model.addVar(0, GRB_INFINITY, 0, GRB_CONTINUOUS);
                        model.addConstr(slopevar >= (yvars[succ] - yvars[i]));
                        model.addConstr(slopevar >= (yvars[i] - yvars[succ]));
                        if (weighted)
                        {
                            objlin += slopevar * c;
                        }
                        else
                        {
                            objlin += slopevar;
                        }   
                    }
                }
            }
        }
        if (quadratic) {
            model.setObjective(objqdr, GRB_MINIMIZE);
        }
        else {
            model.setObjective(objlin, GRB_MINIMIZE);
        }
        model.optimize();
        double max_can_move = std::numeric_limits<double>::max();

        for (size_t i = 0; i < tree.nodes.size(); i++)
        {
            max_can_move = std::min(max_can_move, yvars[i].get(GRB_DoubleAttr_X) - tree.nodes[i].layout.width);
        }

        for (size_t i = 0; i < tree.nodes.size(); i++)
        {            
            tree.nodes[i].layout.y = yvars[i].get(GRB_DoubleAttr_X)-max_can_move;        
            tree.nodes[i].layout.x = tree.nodes[i].timeStep * scalex;
        }
    }

    void minimizeWigglesComp(TemporalTree &tree1, TemporalTree &tree2, bool verbose, bool weighted, bool quadratic, bool symmetric, double percentpadding, double percentpaddingused, int threads, bool isIgnoreRootForWiggleMinimization, bool isOnlyLeaves)
    {
        assert(tree1.leavesOrder.size() == tree1.getLeaves().size());
        assert(tree2.leavesOrder.size() == tree2.getLeaves().size());
        // auto starttime = std::chrono::high_resolution_clock::now();

        double paddingpercent = 1 + percentpadding;
        double viewportwidth = 15;
        double viewportheight = 4;

        for (auto node : tree1.nodes)
        {
            assert(node.areaValue.has_value());
        }
        for (auto node : tree2.nodes)
        {
            assert(node.areaValue.has_value());
        }
        double maxheight = 0;
        double maxx = 0;
        for (auto root : tree1.getRoots())
        {
            computeWidths(tree1, root, paddingpercent);
            maxheight = std::max(maxheight, tree1.nodes[root].layout.width * 2);
            maxx = std::max(maxx, (double)tree1.nodes[root].timeStep);
        }
        for (auto root : tree2.getRoots())
        {
            computeWidths(tree2, root, paddingpercent);
            maxheight = std::max(maxheight, tree2.nodes[root].layout.width * 2);
            maxx = std::max(maxx, (double)tree2.nodes[root].timeStep);
        }
        double scaley = viewportheight / maxheight;
        double scalex = viewportwidth / maxx;

        for (auto &node : tree1.nodes)
        {
            node.layout.width *= scaley;
        }

        for (auto &node : tree2.nodes)
        {
            node.layout.width *= scaley;
        }

        GRBEnv env(true);
        env.set(GRB_IntParam_Threads, threads);
        if (!verbose)
            env.set(GRB_IntParam_OutputFlag, 0);
        env.set(GRB_DoubleParam_MemLimit, 8);
        env.start();
        GRBModel model(env);
        auto nodeToSomeLeafDescendant = tree1.computeNodeToSomeLeafDescendant();
        std::unordered_map<size_t, size_t> orderIndex;
        for (size_t i = 0; i < tree1.leavesOrder.size(); i++)
        {
            orderIndex[tree1.leavesOrder[i]] = i;
        }
        std::vector<GRBVar> yvars;
        for (size_t i = 0; i < tree1.nodes.size(); i++)
        {
            auto node = tree1.nodes[i];
            double miny = tree1.nodes[i].layout.width;
            yvars.push_back(model.addVar(miny, GRB_INFINITY, 0, GRB_CONTINUOUS, "y_" + std::to_string(i)));
        }

        if (symmetric)
        {
            for (auto root : tree1.getRoots()) {
                if (tree1.edgesTime.find(root) != tree1.edgesTime.end() && tree1.edgesTime[root].size() == 1) {
                    model.addConstr(yvars[root] == yvars[tree1.edgesTime[root][0]]);
                }
            }
        }

        // constraints imposed by hierarchy
        for (size_t i = 0; i < tree1.nodes.size(); i++)
        {
            auto parentnode = tree1.nodes[i];
            if (tree1.isLeaf(i))
            {
                continue;
            }
            if (isIgnoreRootForWiggleMinimization && tree1.isRoot(i))
            {
                continue;
            }
            else
            {
                auto descendants = tree1.edgesHierarchy[i];
                double sumwidth = 0;
                for (auto descendant : descendants)
                {
                    sumwidth += tree1.nodes[descendant].layout.width * 2;
                }
                double padding = parentnode.layout.width*2 - sumwidth;
                padding = (padding * percentpaddingused) / (descendants.size() + 1);
                std::sort(descendants.begin(), descendants.end(), [&](size_t a, size_t b) -> bool
                          { return orderIndex[nodeToSomeLeafDescendant[a]] < orderIndex[nodeToSomeLeafDescendant[b]]; });

                for (size_t j = 0; j < descendants.size() - 1; j++)
                {
                    auto nbottom = descendants[j];
                    auto ntop = descendants[j + 1];
                    model.addConstr(yvars[ntop] - yvars[nbottom] >= tree1.nodes[ntop].layout.width + tree1.nodes[nbottom].layout.width + padding);
                }
                auto nbottom = descendants[0];
                auto ntop = descendants[descendants.size() - 1];
                auto upperborder = yvars[i] + parentnode.layout.width;
                auto lowerborder = yvars[i] - parentnode.layout.width;
                if (!(isIgnoreRootForWiggleMinimization && tree1.isRoot(i)))
                {
                    model.addConstr(upperborder - yvars[ntop] >= tree1.nodes[ntop].layout.width + padding);
                    model.addConstr(yvars[nbottom] - lowerborder >= tree1.nodes[nbottom].layout.width + padding);
                }
            }
        }

        GRBQuadExpr objqdr = 0;
        GRBLinExpr objlin = 0;
        // absolute value objective
        std::vector<TemporalTree> trees = {tree1, tree2};
        for (auto tree: trees) {
            for (size_t i = 0; i < tree.nodes.size(); i++)
            {
                if (isIgnoreRootForWiggleMinimization && tree.isRoot(i))
                {
                    continue;
                }
                if (tree.edgesTime.find(i) != tree.edgesTime.end())
                {
                    for (auto succ : tree.edgesTime[i])
                    {
                        if (isOnlyLeaves && !tree.isLeaf(succ) && !tree.isLeaf(i))
                        {
                            continue;
                        }
                        GRBVar slopevar;
                        auto c = tree.nodes[i].layout.width + tree.nodes[succ].layout.width;
                        if (quadratic) {
                            slopevar = model.addVar(-GRB_INFINITY, GRB_INFINITY, 0, GRB_CONTINUOUS);
                            model.addConstr(slopevar == (yvars[succ] - yvars[i]));
                            if (weighted)
                            {
                                objqdr += slopevar * slopevar * c;
                            }
                            else
                            {
                                objqdr += slopevar * slopevar;
                            }   
                        }
                        else {
                            slopevar = model.addVar(0, GRB_INFINITY, 0, GRB_CONTINUOUS);
                            model.addConstr(slopevar >= (yvars[succ] - yvars[i]));
                            model.addConstr(slopevar >= (yvars[i] - yvars[succ]));
                            if (weighted)
                            {
                                objlin += slopevar * c;
                            }
                            else
                            {
                                objlin += slopevar;
                            }   
                        }
                    }
                }
            }
        }
        
        if (quadratic) {
            model.setObjective(objqdr, GRB_MINIMIZE);
        }
        else {
            model.setObjective(objlin, GRB_MINIMIZE);
        }
        model.optimize();
        double max_can_move = std::numeric_limits<double>::max();

        for (size_t i = 0; i < tree1.nodes.size(); i++)
        {
            max_can_move = std::min(max_can_move, yvars[i].get(GRB_DoubleAttr_X) - tree1.nodes[i].layout.width);
        }

        for (size_t i = 0; i < tree1.nodes.size(); i++)
        {            
            tree1.nodes[i].layout.y = yvars[i].get(GRB_DoubleAttr_X)-max_can_move;        
            tree1.nodes[i].layout.x = tree1.nodes[i].timeStep * scalex;

            tree2.nodes[i].layout.y = yvars[i].get(GRB_DoubleAttr_X)-max_can_move;        
            tree2.nodes[i].layout.x = tree2.nodes[i].timeStep * scalex;
        }
    }

    void minimizeWigglesCompFixFirst(TemporalTree &tree1, TemporalTree &tree2, bool verbose, bool weighted, bool quadratic, bool symmetric, double percentpadding, double percentpaddingused, int threads, bool isIgnoreRootForWiggleMinimization, bool isOnlyLeaves)
    {
        GRBEnv env(true);
        env.set(GRB_IntParam_Threads, threads);
        if (!verbose)
            env.set(GRB_IntParam_OutputFlag, 0);
        env.set(GRB_DoubleParam_MemLimit, 8);
        env.start();
        GRBModel model(env);

        std::vector<TemporalTree *> trees = {&tree1, &tree2};
        double maxheight = 0;
        double maxx = 0;
        for (size_t iii = 0; iii < 2; iii++)
        {
            auto &tree = *trees[iii];
            assert(tree.leavesOrder.size() == tree.getLeaves().size());

            double paddingpercent = 1 + percentpadding;

            for (auto node : tree.nodes)
            {
                assert(node.areaValue.has_value());
            }

            for (auto root : tree.getRoots())
            {
                computeWidths(tree, root, paddingpercent);
                maxheight = std::max(maxheight, tree.nodes[root].layout.width * 2);
                maxx = std::max(maxx, (double)tree.nodes[root].timeStep);
            }
        }
        double viewportwidth = 15;
        double viewportheight = 4;
        double scaley = viewportheight / maxheight;
        double scalex = viewportwidth / maxx;
        GRBQuadExpr objqdr = 0;
        GRBLinExpr objlin = 0;
        std::vector<std::vector<GRBVar>> yvarss;
        yvarss.emplace_back();
        yvarss.emplace_back();

        for (size_t iii = 0; iii < 2; iii++)
        {
            auto &tree = *trees[iii];

            for (auto &node : tree.nodes)
            {
                node.layout.width *= scaley;
            }

            auto nodeToSomeLeafDescendant = tree.computeNodeToSomeLeafDescendant();
            std::unordered_map<size_t, size_t> orderIndex;
            for (size_t i = 0; i < tree.leavesOrder.size(); i++)
            {
                orderIndex[tree.leavesOrder[i]] = i;
            }
            std::vector<GRBVar> &yvars = yvarss[iii];
            for (size_t i = 0; i < tree.nodes.size(); i++)
            {
                auto node = tree.nodes[i];
                double miny = tree.nodes[i].layout.width;
                yvars.push_back(model.addVar(miny, GRB_INFINITY, 0, GRB_CONTINUOUS, "y_" + std::to_string(i)));
            }

            if (symmetric)
            {
                for (auto root : tree.getRoots())
                {
                    if (tree.edgesTime.find(root) != tree.edgesTime.end() && tree.edgesTime[root].size() == 1)
                    {
                        model.addConstr(yvars[root] == yvars[tree.edgesTime[root][0]]);
                    }
                }
            }

            // constraints imposed by hierarchy
            for (size_t i = 0; i < tree.nodes.size(); i++)
            {
                auto parentnode = tree.nodes[i];
                if (tree.isLeaf(i))
                {
                    continue;
                }
                else
                {
                    auto descendants = tree.edgesHierarchy[i];
                    double sumwidth = 0;
                    for (auto descendant : descendants)
                    {
                        sumwidth += tree.nodes[descendant].layout.width * 2;
                    }
                    double padding = parentnode.layout.width * 2 - sumwidth;
                    padding = (padding * percentpaddingused) / (descendants.size() + 1);
                    std::sort(descendants.begin(), descendants.end(), [&](size_t a, size_t b) -> bool
                              { return orderIndex[nodeToSomeLeafDescendant[a]] < orderIndex[nodeToSomeLeafDescendant[b]]; });

                    for (size_t j = 0; j < descendants.size() - 1; j++)
                    {
                        auto nbottom = descendants[j];
                        auto ntop = descendants[j + 1];
                        model.addConstr(yvars[ntop] - yvars[nbottom] >= tree.nodes[ntop].layout.width + tree.nodes[nbottom].layout.width + padding);
                    }
                    auto nbottom = descendants[0];
                    auto ntop = descendants[descendants.size() - 1];
                    auto upperborder = yvars[i] + parentnode.layout.width;
                    auto lowerborder = yvars[i] - parentnode.layout.width;
                    if (!(isIgnoreRootForWiggleMinimization && tree.isRoot(i)))
                    {
                        model.addConstr(upperborder - yvars[ntop] >= tree.nodes[ntop].layout.width + padding);
                        model.addConstr(yvars[nbottom] - lowerborder >= tree.nodes[nbottom].layout.width + padding);
                    }
                }
            }

            // absolute value objective
            for (size_t i = 0; i < tree.nodes.size(); i++)
            {
                if (isIgnoreRootForWiggleMinimization && tree.isRoot(i))
                {
                    continue;
                }
                if (tree.edgesTime.find(i) != tree.edgesTime.end())
                {
                    for (auto succ : tree.edgesTime[i])
                    {
                        if (isOnlyLeaves && !tree.isLeaf(succ) && !tree.isLeaf(i))
                        {
                            continue;
                        }
                        GRBVar slopevar;
                        auto c = tree.nodes[i].layout.width + tree.nodes[succ].layout.width;
                        if (quadratic) {
                            slopevar = model.addVar(-GRB_INFINITY, GRB_INFINITY, 0, GRB_CONTINUOUS);
                            model.addConstr(slopevar == (yvars[succ] - yvars[i]));
                            if (weighted)
                            {
                                objqdr += slopevar * slopevar * c;
                            }
                            else
                            {
                                objqdr += slopevar * slopevar;
                            }   
                        }
                        else {
                            slopevar = model.addVar(0, GRB_INFINITY, 0, GRB_CONTINUOUS);
                            model.addConstr(slopevar >= (yvars[succ] - yvars[i]));
                            model.addConstr(slopevar >= (yvars[i] - yvars[succ]));
                            if (weighted)
                            {
                                objlin += slopevar * c;
                            }
                            else
                            {
                                objlin += slopevar;
                            }   
                        }
                    }
                }
            }
        }

        if (quadratic) {
            model.setObjective(objqdr, GRB_MINIMIZE);
        }
        else {
            model.setObjective(objlin, GRB_MINIMIZE);
        }

        auto nodes0 = tree1.getNodesTimeStep(0);
        for (auto node : nodes0) {
            model.addConstr(yvarss[0][node] == yvarss[1][node]);
        }

        
        model.optimize();

        for (size_t iii = 0; iii < 2; iii++) {
            auto& tree = *trees[iii];
            auto& yvars = yvarss[iii];
            double max_can_move = std::numeric_limits<double>::max();

            for (size_t i = 0; i < tree.nodes.size(); i++)
            {
                max_can_move = std::min(max_can_move, yvars[i].get(GRB_DoubleAttr_X) - tree.nodes[i].layout.width);
            }

            for (size_t i = 0; i < tree.nodes.size(); i++)
            {            
                tree.nodes[i].layout.y = yvars[i].get(GRB_DoubleAttr_X)-max_can_move;        
                tree.nodes[i].layout.x = tree.nodes[i].timeStep * scalex;
            }
        }
    }
} // namespace WiggleMin

