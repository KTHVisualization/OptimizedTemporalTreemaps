#include <treeorder.h>
#include "gurobi_c++.h"

namespace TreeOrder
{

    void orderAsInserted(TemporalTree::TTreeOrder &order, const TemporalTree &tree)
    {
        order.clear();
        auto leaves = tree.getLeaves();

        order.reserve(leaves.size());
        for (auto &leaf : leaves)
        {
            order.push_back(leaf);
        }
    }

    void toOrderMap(TemporalTree::TTreeOrderMap &orderMap, const TemporalTree::TTreeOrder &order)
    {
        for (size_t idx = 0; idx < order.size(); idx++)
        {
            orderMap.insert_or_assign(order[idx], idx);
        }
    }

    bool isChildDescRelation(std::vector<size_t> &preorderIndex, std::vector<size_t> &postorderIndex, size_t u, size_t v)
    {
        return (preorderIndex[u] < preorderIndex[v]) != (postorderIndex[u] < postorderIndex[v]);
    }

    void orderGurobiCrossingMinimization(TemporalTree::TTreeOrder &order, const TemporalTree &tree, bool verbose, int threads)
    {
        order.clear();
        auto starttime = std::chrono::high_resolution_clock::now();

        GRBEnv env(true);
        env.set(GRB_IntParam_Threads, threads);
        if (!verbose)
            env.set(GRB_IntParam_OutputFlag, 0);
        env.set(GRB_DoubleParam_MemLimit, 8);
        env.start();
        GRBModel model(env);
        auto preOrderIndex = tree.computePreorderIndex();
        auto postOrderIndex = tree.computePostOrderIndex();
        auto nodeToSomeLeafDescendant = tree.computeNodeToSomeLeafDescendant();

        std::unordered_map<std::pair<size_t, size_t>, GRBVar, pairhash> ordvars;

        std::map<uint64_t, std::vector<size_t>> t_nodes;
        std::map<uint64_t, std::vector<size_t>> t_leaves;
        std::vector<bool> isCurrentLeafDescendant(tree.nodes.size(), false);
        for (size_t i = 0; i < tree.nodes.size(); i++)
        {
            t_nodes[tree.nodes[i].timeStep].push_back(i);
            if (tree.isLeaf(i))
                t_leaves[tree.nodes[i].timeStep].push_back(i);
        }

        for (auto const &[time, nodesattime] : t_nodes)
        {
            // cout<<nodesattime.size()<<endl;
            auto leavesattime = t_leaves[time];

            // create ordering variables
            for (size_t i = 0; i < leavesattime.size(); i++)
            {
                for (size_t j = i + 1; j < leavesattime.size(); j++)
                {
                    std::stringstream ss;
                    ss << leavesattime[i] << "<" << leavesattime[j];
                    ordvars[{leavesattime[i], leavesattime[j]}] = model.addVar(0, 1, 0, GRB_BINARY, ss.str());
                }
            }

            // transitivity constraints
            for (size_t i = 0; i < leavesattime.size(); i++)
            {
                for (size_t j = i + 1; j < leavesattime.size(); j++)
                {
                    for (size_t k = j + 1; k < leavesattime.size(); k++)
                    {
                        auto v1 = ordvars[{leavesattime[i], leavesattime[j]}];
                        auto v2 = ordvars[{leavesattime[j], leavesattime[k]}];
                        auto v3 = ordvars[{leavesattime[i], leavesattime[k]}];
                        auto constraint = model.addConstr(0 <= v1 + v2 - v3);
                        constraint.set(GRB_IntAttr_Lazy, 1);
                        constraint = model.addConstr(v1 + v2 - v3 <= 1);
                        constraint.set(GRB_IntAttr_Lazy, 1);
                    }
                }
            }

            // tree constraints
            for (const auto &nodeIndex : nodesattime)
            {
                if (!tree.isLeaf(nodeIndex) && tree.getHierarchicalChildren(nodeIndex).size() > 1)
                {
                    std::vector<size_t> leaves = tree.computeLeafDescendants(nodeIndex);
                    for (const auto &leaf : leaves)
                        isCurrentLeafDescendant[leaf] = true;

                    for (const auto &leafoutside : leavesattime)
                    {
                        if (isCurrentLeafDescendant[leafoutside])
                            continue;

                        // now force the leaf to be really outside of the current subtree
                        for (size_t i = 0; i < leaves.size(); i++)
                        {
                            for (size_t j = i + 1; j < leaves.size(); j++)
                            {
                                auto leafinside1 = std::min(leaves[i], leaves[j]);
                                auto leafinside2 = std::max(leaves[i], leaves[j]);

                                if (leafoutside < leafinside1 && leafoutside < leafinside2)
                                {
                                    model.addConstr(ordvars[{leafoutside, leafinside1}] == ordvars[{leafoutside, leafinside2}]);
                                }
                                else if (leafoutside > leafinside1 && leafoutside > leafinside2)
                                {
                                    model.addConstr(ordvars[{leafinside1, leafoutside}] == ordvars[{leafinside2, leafoutside}]);
                                }
                                else
                                {
                                    model.addConstr(ordvars[{leafinside1, leafoutside}] == 1 - ordvars[{leafoutside, leafinside2}]);
                                }
                            }
                        }
                    }

                    for (const auto &leaf : leaves)
                        isCurrentLeafDescendant[leaf] = false;
                }
            }
        }

        // crossing constraints
        for (auto const &[time, nodesattime] : t_nodes)
        {
            // edges that go from one time to the next
            std::vector<std::pair<size_t, size_t>> edges;
            for (auto v : nodesattime)
            {
                if (tree.edgesTime.find(v) != tree.edgesTime.end())
                {
                    for (auto w : tree.edgesTime.at(v))
                    {
                        edges.push_back({v, w});
                    }
                }
            }
            // now check for every pair of edges if they cross
            for (size_t i = 0; i < edges.size(); i++)
            {
                for (size_t j = i + 1; j < edges.size(); j++)
                {
                    auto e1 = edges[i];
                    auto e2 = edges[j];

                    if (e1.first == e2.first || e1.second == e2.second)
                        continue;
                    // we dont want do count those crossings
                    if (isChildDescRelation(preOrderIndex, postOrderIndex, e1.first, e2.first) || isChildDescRelation(preOrderIndex, postOrderIndex, e1.second, e2.second))
                        continue;

                    auto leaf1left = nodeToSomeLeafDescendant[e1.first];
                    auto leaf1right = nodeToSomeLeafDescendant[e1.second];
                    auto leaf2left = nodeToSomeLeafDescendant[e2.first];
                    auto leaf2right = nodeToSomeLeafDescendant[e2.second];

                    std::pair<size_t, size_t> varleftind = {std::min(leaf1left, leaf2left), std::max(leaf1left, leaf2left)};
                    std::pair<size_t, size_t> varrightind = {std::min(leaf1right, leaf2right), std::max(leaf1right, leaf2right)};

                    assert(ordvars.find(varleftind) != ordvars.end());
                    assert(ordvars.find(varrightind) != ordvars.end());

                    auto varleft = ordvars[varleftind];
                    auto varright = ordvars[varrightind];

                    auto varCrossing = model.addVar(0, 1, 1, GRB_BINARY);
                    // now set crossing variable
                    if ((leaf1left < leaf2left) == (leaf1right < leaf2right))
                    {
                        // if the two variables have different values then we have a crossing
                        model.addConstr(varCrossing >= varleft - varright);
                        model.addConstr(varCrossing >= varright - varleft);
                    }
                    else
                    {
                        model.addConstr(varCrossing >= 1 - varleft - varright);
                        model.addConstr(varCrossing >= varright - 1 + varleft);
                    }
                }
            }
        }
        model.set(GRB_IntAttr_ModelSense, GRB_MINIMIZE);
        auto t2 = std::chrono::high_resolution_clock::now();
        std::chrono::duration<double, std::milli> ms_double = t2 - starttime;
        model.getEnv().set(GRB_DoubleParam_TimeLimit, (double)TIMELIMIT.count() - ms_double.count() / ((double)1000));
        model.optimize();
        if (model.get(GRB_IntAttr_SolCount) > 0)
        {
            for (auto const &[time, nodesattime] : t_nodes)
            {
                std::vector<size_t> leavesattime = t_leaves[time];
                std::vector<size_t> orderatt(leavesattime.size(), 0);
                for (size_t i = 0; i < leavesattime.size(); i++)
                {
                    int cntbefore = 0;
                    for (size_t j = 0; j < leavesattime.size(); j++)
                    {
                        if (i == j)
                            continue;
                        size_t leaf1 = leavesattime[i];
                        size_t leaf2 = leavesattime[j];

                        if (leaf1 < leaf2 && ordvars[{leaf1, leaf2}].get(GRB_DoubleAttr_X) < 0.5)
                        {
                            cntbefore++;
                        }
                        else if (leaf1 > leaf2 && ordvars[{leaf2, leaf1}].get(GRB_DoubleAttr_X) > 0.5)
                        {
                            cntbefore++;
                        }
                    }
                    orderatt[cntbefore] = leavesattime[i];
                }
                order.insert(order.end(), orderatt.begin(), orderatt.end());
            }
        }
        else
        {
            throw GRBException("No solution found");
        }
    }

    std::list<size_t> getInitialOrder(TemporalTree &tree, size_t v, std::mt19937 &rng)
    {
        std::list<size_t> l;
        if (tree.isLeaf(v))
        {
            l.push_back(v);
        }
        else
        {
            auto ws = tree.edgesHierarchy[v];
            shuffle(ws.begin(), ws.end(), rng);
            for (auto w : tree.edgesHierarchy[v])
            {
                auto lchild = getInitialOrder(tree, w, rng);
                l.splice(l.end(), lchild);
            }
        }
        return l;
    }

    void setInitialPrevVec(size_t v, TemporalTree &tree, std::unordered_map<size_t, double> &index_order, std::unordered_map<size_t, std::multiset<double>> &prev_indices, bool rev)
    {
        prev_indices[v].clear();
        std::vector<size_t> adj;
        if (rev)
        {
            adj = tree.edgesTime[v];
        }
        else
        {
            adj = tree.reverseEdgesTime[v];
        }
        for (auto w : adj)
        {
            prev_indices[v].insert(index_order[w]);
        }
    }

    template <class T>
    double GetMedian(const std::multiset<T> &data)
    {
        if (data.empty())
            return 0;

        const size_t n = data.size();
        double median = 0;

        auto iter = data.cbegin();
        std::advance(iter, n / 2);

        // Middle or average of two middle values
        if (n % 2 == 0)
        {
            const auto iter2 = iter--;
            median = double(*iter + *iter2) / 2; // data[n/2 - 1] AND data[n/2]
        }
        else
        {
            median = *iter;
        }

        return median;
    }

    std::list<size_t> getMedianOrder(TemporalTree &tree, size_t v, std::unordered_map<size_t, double> &index_order, std::unordered_map<size_t, std::multiset<double>> &prev_indices, bool rev)
    {
        std::list<size_t> l;
        TemporalTree::TAdjacency *adjacency;
        if (rev)
        {
            adjacency = &tree.edgesTime;
        }
        else
        {
            adjacency = &tree.reverseEdgesTime;
        }
        if ((*adjacency).find(v) != (*adjacency).end() && (*adjacency)[v].size() > 0)
        {
            setInitialPrevVec(v, tree, index_order, prev_indices, rev);
        }
        else
        {
            prev_indices[v].clear();
        }
        if (tree.isLeaf(v))
        {
            l.push_back(v);
        }
        else
        {
            std::vector<std::list<size_t>> orders;
            auto ws = tree.edgesHierarchy[v];
            std::vector<double> medians;
            std::vector<int> indices;
            std::vector<int> indicesnoprev;
            int j = 0;
            for (auto w : ws)
            {
                orders.push_back(getMedianOrder(tree, w, index_order, prev_indices, rev));
                prev_indices[v].insert(prev_indices[w].begin(), prev_indices[w].end());
                medians.push_back(GetMedian(prev_indices[w]));
                if (prev_indices[w].size() == 0)
                {
                    indicesnoprev.push_back(j);
                }
                else
                {
                    indices.push_back(j);
                }
                j++;
            }
            sort(indices.begin(), indices.end(),
                 [&](int A, int B) -> bool
                 {
                     if ((prev_indices[ws[A]].size() == 0 || prev_indices[ws[B]].size() == 0) && index_order.find(ws[A]) != index_order.end() && index_order.find(ws[B]) != index_order.end())
                     {
                         return index_order[ws[A]] < index_order[ws[B]];
                     }
                     double wA = prev_indices[ws[A]].size() > 0 ? medians[A] : 0;
                     double wB = prev_indices[ws[B]].size() > 0 ? medians[B] : 0;
                     return wA < wB;
                 });
            for (auto x : indicesnoprev)
                indices.push_back(x);
            sort(indices.begin(), indices.end(),
                 [&](int A, int B) -> bool
                 {
                     if ((prev_indices[ws[A]].size() == 0 || prev_indices[ws[B]].size() == 0) && index_order.find(ws[A]) != index_order.end() && index_order.find(ws[B]) != index_order.end())
                     {
                         return index_order[ws[A]] < index_order[ws[B]];
                     }
                     double wA = prev_indices[ws[A]].size() > 0 ? medians[A] : 0;
                     double wB = prev_indices[ws[B]].size() > 0 ? medians[B] : 0;
                     return wA < wB;
                 });
            for (auto w : ws)
            {
                prev_indices[w].clear();
            }

            for (auto i : indices)
            {
                l.splice(l.end(), orders[i]);
            }
        }
        return l;
    }

    void fillIndex(TemporalTree &tree, size_t v, std::unordered_map<size_t, double> &index_order)
    {
        if (tree.isLeaf(v))
            return;
        else
        {
            int s = 0;
            std::vector<double> indices;
            for (auto w : tree.edgesHierarchy[v])
            {
                fillIndex(tree, w, index_order);
                indices.push_back(index_order[w]);
                s += index_order[w];
            }
            assert(tree.edgesHierarchy[v].size() > 0);
            // index_order[v] = s / (double)tree.edgesHierarchy[v].size();
            index_order[v] = *min_element(indices.begin(), indices.end());
        }
    }

    void orderMedianCrossingMinimization(TemporalTree::TTreeOrder &order, TemporalTree &tree)
    {
        std::random_device rd;
        std::mt19937 rng(rd());
        std::map<uint64_t, std::vector<size_t>> t_nodes;
        std::map<uint64_t, std::vector<size_t>> t_roots;
        std::map<uint64_t, std::vector<size_t>> t_leaves;

        std::unordered_map<uint64_t, std::vector<size_t>> t_order;
        std::unordered_map<size_t, double> index_order;
        std::unordered_map<size_t, std::multiset<double>> prev_indices;

        tree.computeReverseEdges();

        int sweeps = 5;

        std::set<uint64_t> stimes;
        for (size_t i = 0; i < tree.nodes.size(); i++)
        {
            stimes.insert(tree.nodes[i].timeStep);
            t_nodes[tree.nodes[i].timeStep].push_back(i);
            if (tree.isLeaf(i))
                t_leaves[tree.nodes[i].timeStep].push_back(i);
            if (tree.reverseEdgesHierarchy.find(i) == tree.reverseEdgesHierarchy.end() || tree.reverseEdgesHierarchy[i].size() == 0)
            {
                t_roots[tree.nodes[i].timeStep].push_back(i);
            }
        }
        std::vector<uint64_t> times(stimes.begin(), stimes.end());
        int lasttime = -1;
        for (int RUNS = 0; RUNS < sweeps; RUNS++)
        {
            for (auto const &[time, nodesattime] : t_nodes)
            {
                std::list<size_t> leaforder;
                if (lasttime == -1)
                {
                    shuffle(t_roots[time].begin(), t_roots[time].end(), rng);
                    for (auto root : t_roots[time])
                    {
                        auto order = getInitialOrder(tree, root, rng);
                        leaforder.splice(leaforder.end(), order);
                    }
                }
                else
                {
                    if (time == times[0])
                        continue;
                    std::vector<std::list<size_t>> orders;
                    std::vector<double> medians;
                    std::vector<size_t> ws;
                    std::vector<int> indices;
                    std::vector<int> indicesnoprev;
                    int j = 0;
                    for (auto root : t_roots[time])
                    {
                        auto order = getMedianOrder(tree, root, index_order, prev_indices, false);
                        orders.push_back(order);
                        ws.push_back(root);
                        medians.push_back(GetMedian(prev_indices[root]));

                        if (prev_indices[root].size() == 0)
                        {
                            indicesnoprev.push_back(j);
                        }
                        else
                        {
                            indices.push_back(j);
                        }
                        j++;
                    }

                    sort(indices.begin(), indices.end(),
                         [&](int A, int B) -> bool
                         {
                             if ((prev_indices[ws[A]].size() == 0 || prev_indices[ws[B]].size() == 0) && index_order.find(ws[A]) != index_order.end() && index_order.find(ws[B]) != index_order.end())
                             {
                                 return index_order[ws[A]] < index_order[ws[B]];
                             }
                             double wA = prev_indices[ws[A]].size() > 0 ? medians[A] : 0;
                             double wB = prev_indices[ws[B]].size() > 0 ? medians[B] : 0;
                             return wA < wB;
                         });
                    for (auto x : indicesnoprev)
                        indices.push_back(x);
                    sort(indices.begin(), indices.end(),
                         [&](int A, int B) -> bool
                         {
                             if ((prev_indices[ws[A]].size() == 0 || prev_indices[ws[B]].size() == 0) && index_order.find(ws[A]) != index_order.end() && index_order.find(ws[B]) != index_order.end())
                             {
                                 return index_order[ws[A]] < index_order[ws[B]];
                             }
                             double wA = prev_indices[ws[A]].size() > 0 ? medians[A] : 0;
                             double wB = prev_indices[ws[B]].size() > 0 ? medians[B] : 0;
                             return wA < wB;
                         });

                    for (auto i : indices)
                    {
                        leaforder.splice(leaforder.end(), orders[i]);
                    }
                }
                int i = 0;
                t_order[time].clear();
                for (auto v : leaforder)
                {
                    t_order[time].push_back(v);
                    index_order[v] = i;
                    i += 1;
                }
                for (auto root : t_roots[time])
                {
                    fillIndex(tree, root, index_order);
                }
                lasttime = time;
            }

            for (int ti = times.size() - 2; ti >= 0; ti--)
            {
                int time = times[ti];
                std::vector<std::list<size_t>> orders;
                std::list<size_t> leaforder;
                std::vector<double> medians;
                std::vector<size_t> ws;
                std::vector<int> indices;
                std::vector<int> indicesnoprev;
                int j = 0;
                for (auto root : t_roots[time])
                {
                    auto order = getMedianOrder(tree, root, index_order, prev_indices, true);
                    medians.push_back(GetMedian(prev_indices[root]));
                    orders.push_back(order);
                    ws.push_back(root);
                    if (prev_indices[root].size() == 0)
                    {
                        indicesnoprev.push_back(j);
                    }
                    else
                    {
                        indices.push_back(j);
                    }
                    j++;
                }
                sort(indices.begin(), indices.end(),
                     [&](int A, int B) -> bool
                     {
                         if ((prev_indices[ws[A]].size() == 0 || prev_indices[ws[B]].size() == 0) && index_order.find(ws[A]) != index_order.end() && index_order.find(ws[B]) != index_order.end())
                         {
                             return index_order[ws[A]] < index_order[ws[B]];
                         }
                         double wA = prev_indices[ws[A]].size() > 0 ? medians[A] : 0;
                         double wB = prev_indices[ws[B]].size() > 0 ? medians[B] : 0;
                         return wA < wB;
                     });
                for (auto x : indicesnoprev)
                    indices.push_back(x);
                sort(indices.begin(), indices.end(),
                     [&](int A, int B) -> bool
                     {
                         if ((prev_indices[ws[A]].size() == 0 || prev_indices[ws[B]].size() == 0) && index_order.find(ws[A]) != index_order.end() && index_order.find(ws[B]) != index_order.end())
                         {
                             return index_order[ws[A]] < index_order[ws[B]];
                         }
                         double wA = prev_indices[ws[A]].size() > 0 ? medians[A] : 0;
                         double wB = prev_indices[ws[B]].size() > 0 ? medians[B] : 0;
                         return wA < wB;
                     });

                for (auto i : indices)
                {
                    leaforder.splice(leaforder.end(), orders[i]);
                }
                t_order[time].clear();
                int i = 0;
                for (auto v : leaforder)
                {
                    t_order[time].push_back(v);
                    index_order[v] = i;
                    i += 1;
                }
                for (auto root : t_roots[time])
                {
                    fillIndex(tree, root, index_order);
                }
                lasttime = time;
            }
        }

        order.clear();
        for (auto time : times)
        {
            order.insert(order.end(), t_order[time].begin(), t_order[time].end());
        }
    }

    unsigned long long countCrossings(const TemporalTree &tree)
    {
        auto order = tree.leavesOrder;
        TemporalTree::TTreeOrderMap orderMap;
        toOrderMap(orderMap, order);

        unsigned long long crossings = 0;

        std::map<uint64_t, std::vector<size_t>> t_nodes;
        std::map<uint64_t, std::vector<size_t>> t_leaves;
        std::vector<bool> isCurrentLeafDescendant(tree.nodes.size(), false);
        auto nodeToSomeLeafDescendant = tree.computeNodeToSomeLeafDescendant();
        auto preOrderIndex = tree.computePreorderIndex();
        auto postOrderIndex = tree.computePostOrderIndex();
        for (size_t i = 0; i < tree.nodes.size(); i++)
        {
            t_nodes[tree.nodes[i].timeStep].push_back(i);
            if (tree.isLeaf(i))
                t_leaves[tree.nodes[i].timeStep].push_back(i);
        }

        for (auto const &[time, nodesattime] : t_nodes)
        {
            // edges that go from one time to the next
            std::vector<std::pair<size_t, size_t>> edges;
            for (auto v : nodesattime)
            {
                if (tree.edgesTime.find(v) != tree.edgesTime.end())
                {
                    for (auto w : tree.edgesTime.at(v))
                    {
                        edges.push_back({v, w});
                    }
                }
            }
            // now check for every pair of edges if they cross
            for (size_t i = 0; i < edges.size(); i++)
            {
                for (size_t j = i + 1; j < edges.size(); j++)
                {
                    auto e1 = edges[i];
                    auto e2 = edges[j];

                    if (e1.first == e2.first || e1.second == e2.second)
                        continue;
                    // we dont want do count those crossings
                    if (isChildDescRelation(preOrderIndex, postOrderIndex, e1.first, e2.first) || isChildDescRelation(preOrderIndex, postOrderIndex, e1.second, e2.second))
                        continue;

                    auto leaf1left = nodeToSomeLeafDescendant[e1.first];
                    auto leaf1right = nodeToSomeLeafDescendant[e1.second];
                    auto leaf2left = nodeToSomeLeafDescendant[e2.first];
                    auto leaf2right = nodeToSomeLeafDescendant[e2.second];

                    if ((orderMap[leaf1left] < orderMap[leaf2left]) != (orderMap[leaf1right] < orderMap[leaf2right]))
                        crossings++;
                }
            }
        }
        return crossings;
    }

void orderGurobiCrossingMinimizationComp(TemporalTree::TTreeOrder& order, const TemporalTree& tree1, const TemporalTree& tree2, bool verbose, int threads) {
    order.clear();
        auto starttime = std::chrono::high_resolution_clock::now();

        GRBEnv env(true);
        env.set(GRB_IntParam_Threads, threads);
        if (!verbose)
            env.set(GRB_IntParam_OutputFlag, 0);
        env.set(GRB_DoubleParam_MemLimit, 8);
        env.start();
        GRBModel model(env);
        auto preOrderIndex = tree1.computePreorderIndex();
        auto postOrderIndex = tree1.computePostOrderIndex();
        auto nodeToSomeLeafDescendant = tree1.computeNodeToSomeLeafDescendant();

        std::unordered_map<std::pair<size_t, size_t>, GRBVar, pairhash> ordvars;

        std::map<uint64_t, std::vector<size_t>> t_nodes;
        std::map<uint64_t, std::vector<size_t>> t_leaves;
        std::vector<bool> isCurrentLeafDescendant(tree1.nodes.size(), false);
        for (size_t i = 0; i < tree1.nodes.size(); i++)
        {
            t_nodes[tree1.nodes[i].timeStep].push_back(i);
            if (tree1.isLeaf(i))
                t_leaves[tree1.nodes[i].timeStep].push_back(i);
        }

        for (auto const &[time, nodesattime] : t_nodes)
        {
            // cout<<nodesattime.size()<<endl;
            auto leavesattime = t_leaves[time];

            // create ordering variables
            for (size_t i = 0; i < leavesattime.size(); i++)
            {
                for (size_t j = i + 1; j < leavesattime.size(); j++)
                {
                    std::stringstream ss;
                    ss << leavesattime[i] << "<" << leavesattime[j];
                    ordvars[{leavesattime[i], leavesattime[j]}] = model.addVar(0, 1, 0, GRB_BINARY, ss.str());
                }
            }

            // transitivity constraints
            for (size_t i = 0; i < leavesattime.size(); i++)
            {
                for (size_t j = i + 1; j < leavesattime.size(); j++)
                {
                    for (size_t k = j + 1; k < leavesattime.size(); k++)
                    {
                        auto v1 = ordvars[{leavesattime[i], leavesattime[j]}];
                        auto v2 = ordvars[{leavesattime[j], leavesattime[k]}];
                        auto v3 = ordvars[{leavesattime[i], leavesattime[k]}];
                        auto constraint = model.addConstr(0 <= v1 + v2 - v3);
                        constraint.set(GRB_IntAttr_Lazy, 1);
                        constraint = model.addConstr(v1 + v2 - v3 <= 1);
                        constraint.set(GRB_IntAttr_Lazy, 1);
                    }
                }
            }

            // tree constraints
            for (const auto &nodeIndex : nodesattime)
            {
                if (!tree1.isLeaf(nodeIndex) && tree1.getHierarchicalChildren(nodeIndex).size() > 1)
                {
                    std::vector<size_t> leaves = tree1.computeLeafDescendants(nodeIndex);
                    for (const auto &leaf : leaves)
                        isCurrentLeafDescendant[leaf] = true;

                    for (const auto &leafoutside : leavesattime)
                    {
                        if (isCurrentLeafDescendant[leafoutside])
                            continue;

                        // now force the leaf to be really outside of the current subtree
                        for (size_t i = 0; i < leaves.size(); i++)
                        {
                            for (size_t j = i + 1; j < leaves.size(); j++)
                            {
                                auto leafinside1 = std::min(leaves[i], leaves[j]);
                                auto leafinside2 = std::max(leaves[i], leaves[j]);

                                if (leafoutside < leafinside1 && leafoutside < leafinside2)
                                {
                                    model.addConstr(ordvars[{leafoutside, leafinside1}] == ordvars[{leafoutside, leafinside2}]);
                                }
                                else if (leafoutside > leafinside1 && leafoutside > leafinside2)
                                {
                                    model.addConstr(ordvars[{leafinside1, leafoutside}] == ordvars[{leafinside2, leafoutside}]);
                                }
                                else
                                {
                                    model.addConstr(ordvars[{leafinside1, leafoutside}] == 1 - ordvars[{leafoutside, leafinside2}]);
                                }
                            }
                        }
                    }

                    for (const auto &leaf : leaves)
                        isCurrentLeafDescendant[leaf] = false;
                }
            }
        }

        // crossing constraints
        for (auto const &[time, nodesattime] : t_nodes)
        {
            std::vector<TemporalTree> trees = {tree1, tree2};
            for (const auto& tree: trees){
                // edges that go from one time to the next
                std::vector<std::pair<size_t, size_t>> edges;
                for (auto v : nodesattime)
                {
                    if (tree.edgesTime.find(v) != tree.edgesTime.end())
                    {
                        for (auto w : tree.edgesTime.at(v))
                        {
                            edges.push_back({v, w});
                        }
                    }
                }
                // now check for every pair of edges if they cross
                for (size_t i = 0; i < edges.size(); i++)
                {
                    for (size_t j = i + 1; j < edges.size(); j++)
                    {
                        auto e1 = edges[i];
                        auto e2 = edges[j];

                        if (e1.first == e2.first || e1.second == e2.second)
                            continue;
                        // we dont want do count those crossings
                        if (isChildDescRelation(preOrderIndex, postOrderIndex, e1.first, e2.first) || isChildDescRelation(preOrderIndex, postOrderIndex, e1.second, e2.second))
                            continue;

                        auto leaf1left = nodeToSomeLeafDescendant[e1.first];
                        auto leaf1right = nodeToSomeLeafDescendant[e1.second];
                        auto leaf2left = nodeToSomeLeafDescendant[e2.first];
                        auto leaf2right = nodeToSomeLeafDescendant[e2.second];

                        std::pair<size_t, size_t> varleftind = {std::min(leaf1left, leaf2left), std::max(leaf1left, leaf2left)};
                        std::pair<size_t, size_t> varrightind = {std::min(leaf1right, leaf2right), std::max(leaf1right, leaf2right)};

                        assert(ordvars.find(varleftind) != ordvars.end());
                        assert(ordvars.find(varrightind) != ordvars.end());

                        auto varleft = ordvars[varleftind];
                        auto varright = ordvars[varrightind];

                        auto varCrossing = model.addVar(0, 1, 1, GRB_BINARY);
                        // now set crossing variable
                        if ((leaf1left < leaf2left) == (leaf1right < leaf2right))
                        {
                            // if the two variables have different values then we have a crossing
                            model.addConstr(varCrossing >= varleft - varright);
                            model.addConstr(varCrossing >= varright - varleft);
                        }
                        else
                        {
                            model.addConstr(varCrossing >= 1 - varleft - varright);
                            model.addConstr(varCrossing >= varright - 1 + varleft);
                        }
                    }
                }
            }
            
        }
        model.set(GRB_IntAttr_ModelSense, GRB_MINIMIZE);
        auto t2 = std::chrono::high_resolution_clock::now();
        std::chrono::duration<double, std::milli> ms_double = t2 - starttime;
        model.getEnv().set(GRB_DoubleParam_TimeLimit, (double)TIMELIMIT.count() - ms_double.count() / ((double)1000));
        model.optimize();
        if (model.get(GRB_IntAttr_SolCount) > 0)
        {
            for (auto const &[time, nodesattime] : t_nodes)
            {
                std::vector<size_t> leavesattime = t_leaves[time];
                std::vector<size_t> orderatt(leavesattime.size(), 0);
                for (size_t i = 0; i < leavesattime.size(); i++)
                {
                    int cntbefore = 0;
                    for (size_t j = 0; j < leavesattime.size(); j++)
                    {
                        if (i == j)
                            continue;
                        size_t leaf1 = leavesattime[i];
                        size_t leaf2 = leavesattime[j];

                        if (leaf1 < leaf2 && ordvars[{leaf1, leaf2}].get(GRB_DoubleAttr_X) < 0.5)
                        {
                            cntbefore++;
                        }
                        else if (leaf1 > leaf2 && ordvars[{leaf2, leaf1}].get(GRB_DoubleAttr_X) > 0.5)
                        {
                            cntbefore++;
                        }
                    }
                    orderatt[cntbefore] = leavesattime[i];
                }
                order.insert(order.end(), orderatt.begin(), orderatt.end());
            }
        }
        else
        {
            throw GRBException("No solution found");
        }
    }

void orderGurobiCrossingMinimizationCompFixFirst(TemporalTree::TTreeOrder& order1, TemporalTree::TTreeOrder& order2, TemporalTree& tree1, TemporalTree& tree2, bool verbose, int threads) {
        order1.clear();
        order2.clear();
        auto starttime = std::chrono::high_resolution_clock::now();
        
        std::vector<TemporalTree::TTreeOrder*> orders = {&order1, &order2};
        std::vector<TemporalTree*> trees = {&tree1, &tree2};
        
        std::unordered_map<std::pair<size_t, size_t>, GRBVar, pairhash> ordvars1;
        std::unordered_map<std::pair<size_t, size_t>, GRBVar, pairhash> ordvars2;
        std::vector<std::unordered_map<std::pair<size_t, size_t>, GRBVar, pairhash>*> ordvarss = {&ordvars1, &ordvars2};
        std::vector<std::map<uint64_t, std::vector<size_t>>> t_nodess;
        
        t_nodess.emplace_back();
        t_nodess.emplace_back();
        std::vector<std::map<uint64_t, std::vector<size_t>>> t_leavess;
        t_leavess.emplace_back();
        t_leavess.emplace_back();
        
        GRBEnv env(true);
        env.set(GRB_IntParam_Threads, threads);
        if (!verbose)
            env.set(GRB_IntParam_OutputFlag, 0);
        env.set(GRB_DoubleParam_MemLimit, 8);
        env.start();
        GRBModel model(env);
        
        for (size_t iii = 0; iii < 2; iii++) {
            auto& tree = *trees[iii];
            auto& order = *orders[iii];
            auto preOrderIndex = tree.computePreorderIndex();
            auto postOrderIndex = tree.computePostOrderIndex();
            auto nodeToSomeLeafDescendant = tree.computeNodeToSomeLeafDescendant();

            auto& ordvars = *ordvarss[iii];

            auto& t_nodes = t_nodess[iii];
            auto& t_leaves = t_leavess[iii];
            std::vector<bool> isCurrentLeafDescendant(tree.nodes.size(), false);
            for (size_t i = 0; i < tree.nodes.size(); i++)
            {
                t_nodes[tree.nodes[i].timeStep].push_back(i);
                if (tree.isLeaf(i))
                    t_leaves[tree.nodes[i].timeStep].push_back(i);
            }

            for (auto const &[time, nodesattime] : t_nodes)
            {
                // cout<<nodesattime.size()<<endl;
                auto leavesattime = t_leaves[time];

                // create ordering variables
                for (size_t i = 0; i < leavesattime.size(); i++)
                {
                    for (size_t j = i + 1; j < leavesattime.size(); j++)
                    {
                        std::stringstream ss;
                        ss << leavesattime[i] << "<" << leavesattime[j];
                        ordvars[{leavesattime[i], leavesattime[j]}] = model.addVar(0, 1, 0, GRB_BINARY, ss.str());
                    }
                }

                // transitivity constraints
                for (size_t i = 0; i < leavesattime.size(); i++)
                {
                    for (size_t j = i + 1; j < leavesattime.size(); j++)
                    {
                        for (size_t k = j + 1; k < leavesattime.size(); k++)
                        {
                            auto v1 = ordvars[{leavesattime[i], leavesattime[j]}];
                            auto v2 = ordvars[{leavesattime[j], leavesattime[k]}];
                            auto v3 = ordvars[{leavesattime[i], leavesattime[k]}];
                            auto constraint = model.addConstr(0 <= v1 + v2 - v3);
                            constraint.set(GRB_IntAttr_Lazy, 1);
                            constraint = model.addConstr(v1 + v2 - v3 <= 1);
                            constraint.set(GRB_IntAttr_Lazy, 1);
                        }
                    }
                }

                // tree constraints
                for (const auto &nodeIndex : nodesattime)
                {
                    if (!tree.isLeaf(nodeIndex) && tree.getHierarchicalChildren(nodeIndex).size() > 1)
                    {
                        std::vector<size_t> leaves = tree.computeLeafDescendants(nodeIndex);
                        for (const auto &leaf : leaves)
                            isCurrentLeafDescendant[leaf] = true;

                        for (const auto &leafoutside : leavesattime)
                        {
                            if (isCurrentLeafDescendant[leafoutside])
                                continue;

                            // now force the leaf to be really outside of the current subtree
                            for (size_t i = 0; i < leaves.size(); i++)
                            {
                                for (size_t j = i + 1; j < leaves.size(); j++)
                                {
                                    auto leafinside1 = std::min(leaves[i], leaves[j]);
                                    auto leafinside2 = std::max(leaves[i], leaves[j]);

                                    if (leafoutside < leafinside1 && leafoutside < leafinside2)
                                    {
                                        model.addConstr(ordvars[{leafoutside, leafinside1}] == ordvars[{leafoutside, leafinside2}]);
                                    }
                                    else if (leafoutside > leafinside1 && leafoutside > leafinside2)
                                    {
                                        model.addConstr(ordvars[{leafinside1, leafoutside}] == ordvars[{leafinside2, leafoutside}]);
                                    }
                                    else
                                    {
                                        model.addConstr(ordvars[{leafinside1, leafoutside}] == 1 - ordvars[{leafoutside, leafinside2}]);
                                    }
                                }
                            }
                        }

                        for (const auto &leaf : leaves)
                            isCurrentLeafDescendant[leaf] = false;
                    }
                }
            }

            // crossing constraints
            for (auto const &[time, nodesattime] : t_nodes)
            {
                // edges that go from one time to the next
                std::vector<std::pair<size_t, size_t>> edges;
                for (auto v : nodesattime)
                {
                    if (tree.edgesTime.find(v) != tree.edgesTime.end())
                    {
                        for (auto w : tree.edgesTime.at(v))
                        {
                            edges.push_back({v, w});
                        }
                    }
                }
                // now check for every pair of edges if they cross
                for (size_t i = 0; i < edges.size(); i++)
                {
                    for (size_t j = i + 1; j < edges.size(); j++)
                    {
                        auto e1 = edges[i];
                        auto e2 = edges[j];

                        if (e1.first == e2.first || e1.second == e2.second)
                            continue;
                        // we dont want do count those crossings
                        if (isChildDescRelation(preOrderIndex, postOrderIndex, e1.first, e2.first) || isChildDescRelation(preOrderIndex, postOrderIndex, e1.second, e2.second))
                            continue;

                        auto leaf1left = nodeToSomeLeafDescendant[e1.first];
                        auto leaf1right = nodeToSomeLeafDescendant[e1.second];
                        auto leaf2left = nodeToSomeLeafDescendant[e2.first];
                        auto leaf2right = nodeToSomeLeafDescendant[e2.second];

                        std::pair<size_t, size_t> varleftind = {std::min(leaf1left, leaf2left), std::max(leaf1left, leaf2left)};
                        std::pair<size_t, size_t> varrightind = {std::min(leaf1right, leaf2right), std::max(leaf1right, leaf2right)};

                        assert(ordvars.find(varleftind) != ordvars.end());
                        assert(ordvars.find(varrightind) != ordvars.end());

                        auto varleft = ordvars[varleftind];
                        auto varright = ordvars[varrightind];

                        auto varCrossing = model.addVar(0, 1, 1, GRB_BINARY);
                        // now set crossing variable
                        if ((leaf1left < leaf2left) == (leaf1right < leaf2right))
                        {
                            // if the two variables have different values then we have a crossing
                            model.addConstr(varCrossing >= varleft - varright);
                            model.addConstr(varCrossing >= varright - varleft);
                        }
                        else
                        {
                            model.addConstr(varCrossing >= 1 - varleft - varright);
                            model.addConstr(varCrossing >= varright - 1 + varleft);
                        }
                    }
                }
            }
        }        
            // cout<<nodesattime.size()<<endl;
        auto leaves0 = t_leavess[0][0];

        // create ordering variables
        for (size_t i = 0; i < leaves0.size(); i++)
        {
            for (size_t j = i + 1; j < leaves0.size(); j++)
            {
                std::stringstream ss;
                ss << leaves0[i] << "<" << leaves0[j];
                auto u = leaves0[i];
                auto v = leaves0[j];
                model.addConstr(ordvars1[{u, v}] == ordvars2[{u, v}]);
            }
        }
        
        model.set(GRB_IntAttr_ModelSense, GRB_MINIMIZE);
        auto t2 = std::chrono::high_resolution_clock::now();
        std::chrono::duration<double, std::milli> ms_double = t2 - starttime;
        model.getEnv().set(GRB_DoubleParam_TimeLimit, (double)TIMELIMIT.count() - ms_double.count() / ((double)1000));
        model.optimize();
        for (size_t iii = 0; iii < 2; iii++) {
            auto& t_nodes = t_nodess[iii];
            auto& t_leaves = t_leavess[iii];
            auto& ordvars = *ordvarss[iii];
            auto& order = *orders[iii];
            auto& tree = *trees[iii];
            if (model.get(GRB_IntAttr_SolCount) > 0)
            {
                for (auto const &[time, nodesattime] : t_nodes)
                {
                    std::vector<size_t> leavesattime = t_leaves[time];
                    std::vector<size_t> orderatt(leavesattime.size(), 0);
                    for (size_t i = 0; i < leavesattime.size(); i++)
                    {
                        int cntbefore = 0;
                        for (size_t j = 0; j < leavesattime.size(); j++)
                        {
                            if (i == j)
                                continue;
                            size_t leaf1 = leavesattime[i];
                            size_t leaf2 = leavesattime[j];

                            if (leaf1 < leaf2 && ordvars[{leaf1, leaf2}].get(GRB_DoubleAttr_X) < 0.5)
                            {
                                cntbefore++;
                            }
                            else if (leaf1 > leaf2 && ordvars[{leaf2, leaf1}].get(GRB_DoubleAttr_X) > 0.5)
                            {
                                cntbefore++;
                            }
                        }
                        orderatt[cntbefore] = leavesattime[i];
                    }
                    order.insert(order.end(), orderatt.begin(), orderatt.end());
                }
                
            }else
            {
                throw GRBException("No solution found");
            }
        }       
    }
} // namespace TreeOrder