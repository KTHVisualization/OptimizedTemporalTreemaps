/**
 * Configuration file for available datasets
 * Contains dataset metadata and sources
 */
const DATASET_CONFIG = {
  datasets: [
    {   id: 'population_largerthan500_weighted_0percentpadding', 
        name: 'Population Larger Than 500K (Weighted, 0% Padding)', 
        source: 'data/population_largerthan500_weighted_0percentpadding.js' 
    },

    {   id: 'population_largerthan500_unweighted_0percentpadding', 
        name: 'Population Larger Than 500K (Unweighted, 0% Padding)', 
        source: 'data/population_largerthan500_unweighted_0percentpadding.js' 
    },


    {   id: 'PopulationNoWiggleMin', 
        name: 'Population - Crossing Optimized, No Wiggle Minimized', 
        source: 'data/PopulationNoWiggleMin.js' 
    },

    {   id: 'PopulationNoOpt', 
        name: 'Population - No Optimized', 
        source: 'data/PopulationNoOpt.js' 
    },


    {   id: 'PopulationWFIGwigglemin', 
        name: 'Small Population - Wiggle Minimized', 
        source: 'data/PopulationWFIGwigglemin.js' 
    },

    {   id: 'PopulationWFIGwiggleminWeighted', 
        name: 'Small Population - Weighted Wiggle Minimized', 
        source: 'data/PopulationWFIGwiggleminWeighted.js' 
    },

    {   id: 'PopulationWFIGnowigglemin', 
        name: 'Small Population - No Wiggle Minimized', 
        source: 'data/PopulationWFIGnowigglemin.js' 
    },

    {   id: 'Cartilage_optimized_weighted_ILP', 
        name: 'MeSH Cartilage - Weighted Wiggle Optimized', 
        source: 'data/Cartilage_optimized_weighted_ILP.js'
    },

    {   id: 'Cartilage_optimized_unweighted_ILP', 
        name: 'MeSH Cartilage - Wiggle Optimized', 
        source: "data/Cartilage_optimized_unweighted_ILP.js"
    },

    {   id: 'UrinaryTract_optimized_weighted_ILP', 
        name: 'MeSH UrinaryTract - Weighted Wiggle Optimized', 
        source: "data/UrinaryTract_optimized_weighted_ILP.js"
    },

    {   id: 'UrinaryTract_optimized_unweighted_ILP', 
        name: 'MeSH UrinaryTract - Wiggle Optimized', 
        source: "data/UrinaryTract_optimized_unweighted_ILP.js"
    },

    {   id: 'DigestivePhysiology_optimized_weighted_ILP', 
        name: 'MeSH DigestivePhysiology - Weighted Wiggle Optimized', 
        source: "data/DigestivePhysiology_optimized_weighted_ILP.js"
    },

    {   id: 'GitInviwoAnimationTo2017Jan15', 
        name: 'Git Inviwo - Animation Moduel (to 15th Jan, 2017)', 
        source: "data/GitInviwoAnimationTo2017Jan15.js"
    },

    {   id: 'GitInviwoAnimationTo2019', 
        name: 'Git Inviwo - Animation Moduel (to 1st Jan, 2019)', 
        source: "data/GitInviwoAnimationTo2019.js"
    },

    {   id: 'VF_AccRoot_leavesOnly', 
        name: 'Viscous Finger - Wiggle Optimzed', 
        source: "data/VF_AccRoot_leavesOnly.js"
    },

    {   id: 'VF_AccRoot_leavesOnly_Weighted', 
        name: 'Viscous Finger - Weighted Wiggle Optimzed', 
        source: "data/VF_AccRoot_leavesOnly_Weighted.js"
    },

    {   id: 'VF_AccRoot_leavesOnly_Wiggle', 
        name: 'Viscous Finger - No Wiggle Optimzed', 
        source: "data/VF_AccRoot_Wiggle.js"
    },

    {   id: 'VF_Short', 
        name: 'Viscous Finger Short - Wiggle Optimzed', 
        source: "data/VF_Short.js"
    },

    {   id: 'VF_Short_Weighted', 
        name: 'Viscous Finger - Weighted Wiggle Optimzed', 
        source: "data/VF_AccRoot_Weighted.js"
    },

    {   id: 'VF_Short_Wiggle', 
        name: 'Viscous Finger Short - No Wiggle Optimzed', 
        source: "data/VF_Short_Wiggle.js"
    },

    {   id: 'Synth_NoWiggleMin', 
        name: 'Synthetic Illustration - No Wiggle Optimzed', 
        source: "data/Synth_NoWiggleMin.js"
    },

    {   id: 'Synth_WiggleMin', 
        name: 'Synthetic Illustration - Wiggle Optimzed', 
        source: "data/Synth_WiggleMin.js"
    },

    {   id: 'Synth_WiggleMinWeighted', 
        name: 'Synthetic Illustration - Weighted Wiggle Optimzed', 
        source: "data/Synth_WiggleMinWeighted.js"
    },


    {   id: 'Synthetic3025', 
        name: 'Parameter Illustration - epsilon = 0.3, zeta = 0.25', 
        source: "data/Synthetic3025.js"
    },

    {   id: 'Synthetic3050', 
        name: 'Parameter Illustration - epsilon = 0.3, zeta = 0.5', 
        source: "data/Synthetic3050.js"
    },

    {   id: 'Synthetic3075', 
        name: 'Parameter Illustration - epsilon = 0.3, zeta = 0.75', 
        source: "data/Synthetic3075.js"
    },

    {   id: 'Synthetic5025', 
        name: 'Parameter Illustration - epsilon = 0.5, zeta = 0.25', 
        source: "data/Synthetic5025.js"
    },

    {   id: 'Synthetic5050', 
        name: 'Parameter Illustration - epsilon = 0.5, zeta = 0.50', 
        source: "data/Synthetic5050.js"
    },

    {   id: 'Synthetic5075', 
        name: 'Parameter Illustration - epsilon = 0.5, zeta = 0.75', 
        source: "data/Synthetic5075.js"
    },


    {   id: 'Synthetic7025', 
        name: 'Parameter Illustration - epsilon = 0.7, zeta = 0.25', 
        source: "data/Synthetic7025.js"
    },

    {   id: 'Synthetic7050', 
        name: 'Parameter Illustration - epsilon = 0.7, zeta = 0.50', 
        source: "data/Synthetic7050.js"
    },

    {   id: 'Synthetic7075', 
        name: 'Parameter Illustration - epsilon = 0.7, zeta = 0.75', 
        source: "data/Synthetic7075.js"
    },

    {   id: 'WiggleIllustration', 
        name: 'Wiggle Illustration', 
        source: "data/WiggleIllustration.js"
    },


    {   id: 'GitGudhi2017_opt', 
        name: '(Large) Git Gudhi - Wiggle Optimized', 
        source: "data/GitGudhi2017_opt.js"
    },

    {   id: 'GitGudhi2017_opt_w', 
        name: '(Large) Git Gudhi - Weighted Wiggle Optimized', 
        source: "data/GitGudhi2017_opt_w.js"
    },

    {   id: 'GitGudhi2017_noOpt', 
        name: '(Large) Git Gudhi - No Wiggle Optimized', 
        source: "data/GitGudhi2017_noOpt.js"
    },

    {   id: 'TestTree', 
        name: 'Test Tree', 
        source: "data/TestTree.js"
    },
    
  ],
  datasets_compare : [
    {   id: 'cylinder2d_631_638_w', 
        name: 'Cylinder2D (631 - 638) - Wasserstein Distance', 
        source: "data_compare/cylinder2d_631_638_w.js"
    },

    {   id: 'cylinder2d_631_638_e', 
        name: 'Cylinder2D (631 - 638) - Edit Distance', 
        source: "data_compare/cylinder2d_631_638_e.js"
    },

    {   id: 'cylinder2d_610_649_w_short', 
        name: 'Cylinder2D (610 - 649) - Wasserstein Distance', 
        source: "data_compare/cylinder2d_610_649_w_short.js"
    },

    {   id: 'cylinder2d_610_649_e_short', 
        name: 'Cylinder2D (610 - 649) - Edit Distance', 
        source: "data_compare/cylinder2d_610_649_e_short.js"
    },

    {   id: 'Tangaroa_w_138_144', 
        name: 'Tangaroa 3D (138 - 144) - Wasserstein Distance', 
        source: "data_compare/Tangaroa_w_138_144.js"
    },
    
    {   id: 'Tangaroa_p_138_144', 
        name: 'Tangaroa 3D (138 - 144) - Path Mapping Distance', 
        source: "data_compare/Tangaroa_p_138_144.js"
    },

    {   id: 'Tangaroa_w_188_191', 
        name: 'Tangaroa 3D (188 - 191) - Wasserstein Distance', 
        source: "data_compare/Tangaroa_w_188_191.js"
    },
    
    {   id: 'Tangaroa_p_188_191', 
        name: 'Tangaroa 3D (188 - 191) - Path Mapping Distance', 
        source: "data_compare/Tangaroa_p_188_191.js"
    },

    {   id: 'storm_27Dec_w', 
        name: 'Storm - Wasserstein Distance', 
        source: "data_compare/storm_27Dec_w.js"
    },
    
    {   id: 'storm_27Dec_e', 
        name: 'Storm - Edit Distance', 
        source: "data_compare/storm_27Dec_e.js"
    },

    {   id: 'storm_27DecHalfDay_w', 
        name: 'Storm Half Day - Wasserstein Distance', 
        source: "data_compare/storm_27DecHalfDay_w.js"
    },
    
    {   id: 'storm_27DecHalfDay_e', 
        name: 'Storm Half Day - Edit Distance', 
        source: "data_compare/storm_27DecHalfDay_e.js"
    },

    {   id: 'repo1_test', 
        name: 'Repo 1', 
        source: "data_compare/repo1_test.js"
    },
    
    {   id: 'repo2_test', 
        name: 'Repo 2', 
        source: "data_compare/repo2_test.js"
    },
  ]
};