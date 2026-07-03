# Optimized Temporal Treemaps 
The implementation for the paper **Minimizing Visual Clutter In Temporal Treemaps to Enable Comparison of Evolving Hierarchies**.

The code consists of 2 separated modules: optimization (in C++) and visualization (in Javascript).

Under `quantitative` directory, the implementation for our quantitative experiments can be found.
We also included generated data sets in `Data` directory. 

The `json` library is included as a submodule, make sure to include `--recursive` option when cloning or use the command 

> ```git submodule update --init --recursive```

if already cloned.

## Optimization Module

### Building
1. (Skip if Gurobi is installed) Obtain a Gurobi license, [academies can request a free license](https://www.gurobi.com/academia/academic-program-and-licenses/). Then download set up Gurobi following the [guide](https://support.gurobi.com/hc/en-us/articles/14799677517585-Getting-Started-with-Gurobi-Optimizer).

2. Use `CMake` to build the source code. 

The project should be generated automatically, but if Gurobi cannot be found, one can point directly the flags to the corresponding files and directories.

### How to use 
There are a number of options for the optimization code. 
- `-fin <pathToInJson>` : path to the input json (e.g. `../Data/ChosenDatasets/Population/population.json`)
- Crossing optimization, either:
    - `-ILP` : use Gurobi to optimize the order of the leaves.
    - `-Median` : use **Median** strategy to optimizing the crossing.
    - `` : no crossing optimization
- `-wiggleminL` : perform wiggle optimization. This option activates additional parameters:
    - `-weighted` : perform weighted wiggle optimization.
    - `-percentpadding <value>` : amount of padding to be added to the data, `value` is entered as percentage (e.g. 100). Default value is 20.
    - `-percentpaddingused <value>` : amount of space between two consecutive children, `value` is entered as percentage (e.g. 10). Default value is 70.
    - Special types of layouts include:
        - `-symmetric` : wiggle optimization with symmetry.
        - `-ignoreroot` : wiggle optimization while ignoring the root layer.
        - `-leavesonly` : wiggle optimization only for the leaves of the tree.

- `-fout <pathToOutJson>` : path to the output json for drawing (e.g. `../Data/Optimized/ParentChildSwitch_Optimized.json`).

- `-v` : show the optimization information.

- `-numthreads <value>` : number of threads used in the optimization. Default `value` is 1, 

- `-barycenteredges` : draw edges that move between different layers in the middle layer (e.g. edges that move from layer 2 to 3 will be in layer 2.5).

- `-nodenames` : keep the nodes' name in the final json.

- `-copy <DisplayName>` : copy the optimized file to the visualization file `index.html`. The `DisplayName` will be updated after refreshing. 

- Co-optimization options:
    - `-comparison` : co-optimization for two trees with differences in temporal edges only.
    - `-comparisondiff` : co-optimization for two trees with similar trees for the first time step.
    - For either of these options, the second tree must also be entered with the flag `-fin2 <pathToSecondJson>`.
    - This also activate additional flags `-fout2 <pathToOutJson2>`, `-copycomp1 <DisplayName1>` and `-copycomp2 <DisplayName2>` which work similarly for the visualization file `compare.html`. 


## Visualization Module
You need to activate a local HTTP server (for instance, you can do with Python using `python -m http.server <portNumber>`). Then you can navigate to the visualization folder.
The UI is largely contributed by Shradha Retharekar and Son Le Thanh.

### Rasterizing
The images are downloaded as svgs. Due to different rasterizing engines of the browsers, the images can appear fragmented with white thin lines appear at each time step (these lines appear at random and can disappear if we hover the image or zoom it). To produce the final png, one can perform the following actions:
1. Activate the option `Crisp Edges`.
2. Download the svg.
3. Use the script `rasterize.py` under `utils` directory with the command `python rasterize.py <fileName> <desiredWidth>` where `fileName` is the svg file and `desiredWidth` should be a large number (e.g. 10000).
4. The script will produce a html file with the same name as the svg.
5. Open the html file.
6. Choose the image extension.
7. Save the rasterized image.

The produced images will not be affected by said problem. One can resize the result to smaller resolution if needed. 
