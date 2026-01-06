import os
import sys
import subprocess

threads = "1"

root = ".."
outfolder = os.path.join(root, "Optimized")
binary = "TTMPL"
onlylogs = True
runforre = "GitInviwo"

cwd = os.getcwd()
def runcluster(params, name):
    clusterprefix = ["qsub", "-N", name, "-l", "bc4", "-e", "~/error.log", "-o", "~/out.log", "-l", "h_vmem=16G", "-l", "s_vmem=16G", "runscript.sh"]
    call = clusterprefix + [cwd, os.path.join("../../../logs/" +name)] + params
    call = " ".join(call)
    print(call)
    os.system(call)

def runlocal(params, name):
    call = [os.path.join("../../../build/", binary)] + params + [">", os.path.join("../../../logs/" +name + ".log")]
    call = " ".join(call)
    print(call)
    os.system(call)

for path, subdirs, files in os.walk(root):
    for name in files:
        if "Optimized" not in path:
            if runforre not in path and runforre not in name: continue
            for weighted in [True, False]:
                for padding in [0, 0.1, 0.5, 1]:
                    for symmetric in [True, False]:
                        for alg in ["Median", "ILP"]:
                            if "TrackingData" in path and padding > 0:
                                continue
                            if "Population" in path and padding > 0:
                                continue
                            if "TrackingData" not in path and "Population" not in path and padding == 0:
                                continue
                            if symmetric == True and "TrackingData" not in path: 
                                continue
                            

                            params = ["-v", "-fin", os.path.join(path, name), "-wiggleminL", "-numthreads", threads]
                            outname = name.removesuffix(".json")
                            if weighted:
                                params.append("-weighted")
                                outname += "_optimized_weighted"
                            else:
                                outname += "_optimized_unweighted"
                            if symmetric:
                                params.append("-symmetric")
                                outname += "_symmetric"
                            params.extend(["-percentpadding", str(padding)])
                            percentpadding = str(int(padding*100))
                            outname += f"_{percentpadding}percentpadding"                        
                            params.append("-barycenteredges")
                            if "population" in name:
                                params.append("-nodenames")

                            outname += "_"+alg
                            params.append("-"+alg)
                            if not onlylogs:
                                params.extend(["-fout", outname + ".json"])

                            runcluster(params, outname)