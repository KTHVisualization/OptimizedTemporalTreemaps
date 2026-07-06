// Color schemes using D3 for discrete color properties (make sure to include D3 script before this)

const colorSchemes = {
  sequential: {
    // Single-hue schemes
    'Blues': (n) => d3.schemeBlues[n],
    'Greens': (n) => d3.schemeGreens[n],
    'Greys': (n) => d3.schemeGreys[n],
    'Oranges': (n) => d3.schemeOranges[n],
    'Purples': (n) => d3.schemePurples[n],
    'Reds': (n) => d3.schemeReds[n],
    
    // Multi-hue schemes
    'BuGn': (n) => d3.schemeBuGn[n],
    'BuPu': (n) => d3.schemeBuPu[n],
    'GnBu': (n) => d3.schemeGnBu[n],
    'OrRd': (n) => d3.schemeOrRd[n],
    'PuBuGn': (n) => d3.schemePuBuGn[n],
    'PuBu': (n) => d3.schemePuBu[n],
    'PuRd': (n) => d3.schemePuRd[n],
    'RdPu': (n) => d3.schemeRdPu[n],
    'YlGnBu': (n) => d3.schemeYlGnBu[n],
    'YlGn': (n) => d3.schemeYlGn[n],
    'YlOrBr': (n) => d3.schemeYlOrBr[n],
    'YlOrRd': (n) => d3.schemeYlOrRd[n],
    
    // Perceptually uniform
    'Cividis': (n) => Array.from({length: n}, (_, i) => d3.interpolateCividis(i / (n - 1))),
    'Viridis': (n) => Array.from({length: n}, (_, i) => d3.interpolateViridis(i / (n - 1))),
    'Inferno': (n) => Array.from({length: n}, (_, i) => d3.interpolateInferno(i / (n - 1))),
    'Magma': (n) => Array.from({length: n}, (_, i) => d3.interpolateMagma(i / (n - 1))),
    'Plasma': (n) => Array.from({length: n}, (_, i) => d3.interpolatePlasma(i / (n - 1))),
    'Warm': (n) => Array.from({length: n}, (_, i) => d3.interpolateWarm(i / (n - 1))),
    'Cool': (n) => Array.from({length: n}, (_, i) => d3.interpolateCool(i / (n - 1))),
    'CubeheliDefault': (n) => Array.from({length: n}, (_, i) => d3.interpolateCubehelixDefault(i / (n - 1))),
    'Turbo': (n) => Array.from({length: n}, (_, i) => d3.interpolateTurbo(i / (n - 1)))
  },
  
  diverging: {
    'BrBG': (n) => d3.schemeBrBG[n],
    'PRGn': (n) => d3.schemePRGn[n],
    'PiYG': (n) => d3.schemePiYG[n],
    'PuOr': (n) => d3.schemePuOr[n],
    'RdBu': (n) => d3.schemeRdBu[n],
    'RdGy': (n) => d3.schemeRdGy[n],
    'RdYlBu': (n) => d3.schemeRdYlBu[n],
    'RdYlGn': (n) => d3.schemeRdYlGn[n],
    'Spectral': (n) => d3.schemeSpectral[n]
  },
  
  cyclical: {
    'Rainbow': (n) => Array.from({length: n}, (_, i) => d3.interpolateRainbow(i / n)),
    'Sinebow': (n) => Array.from({length: n}, (_, i) => d3.interpolateSinebow(i / n))
  },


  // Add continuous color schemes
  continuousSequential: {
    // Single-hue continuous
    'Blues': () => d3.interpolateBlues,
    'Greens': () => d3.interpolateGreens,
    'Greys': () => d3.interpolateGreys,
    'Oranges': () => d3.interpolateOranges,
    'Purples': () => d3.interpolatePurples,
    'Reds': () => d3.interpolateReds,
    
    // Multi-hue continuous
    'BuGn': () => d3.interpolateBuGn,
    'BuPu': () => d3.interpolateBuPu,
    'GnBu': () => d3.interpolateGnBu,
    'OrRd': () => d3.interpolateOrRd,
    'PuBuGn': () => d3.interpolatePuBuGn,
    'PuBu': () => d3.interpolatePuBu,
    'PuRd': () => d3.interpolatePuRd,
    'RdPu': () => d3.interpolateRdPu,
    'YlGnBu': () => d3.interpolateYlGnBu,
    'YlGn': () => d3.interpolateYlGn,
    'YlOrBr': () => d3.interpolateYlOrBr,
    'YlOrRd': () => d3.interpolateYlOrRd,

        // Perceptually uniform continuous
    'Cividis': () => d3.interpolateCividis,
    'Viridis': () => d3.interpolateViridis,
    'Inferno': () => d3.interpolateInferno,
    'Magma': () => d3.interpolateMagma,
    'Plasma': () => d3.interpolatePlasma,
    'Warm': () => d3.interpolateWarm,
    'Cool': () => d3.interpolateCool,
    'CubehelixDefault': () => d3.interpolateCubehelixDefault,
    'Turbo': () => d3.interpolateTurbo
  },
  
  continuousDiverging: {
    'BrBG': () => d3.interpolateBrBG,
    'PRGn': () => d3.interpolatePRGn,
    'PiYG': () => d3.interpolatePiYG,
    'PuOr': () => d3.interpolatePuOr,
    'RdBu': () => d3.interpolateRdBu,
    'RdGy': () => d3.interpolateRdGy,
    'RdYlBu': () => d3.interpolateRdYlBu,
    'RdYlGn': () => d3.interpolateRdYlGn,
    'Spectral': () => d3.interpolateSpectral
  },

    continuousCyclical: {
    'Rainbow': () => d3.interpolateRainbow,
    'Sinebow': () => d3.interpolateSinebow
  }
  
};