#pragma once

#include <set>
#include <map>
#include <cstdint>
#include <string>
#include <vector>
#include <iostream>
#include <algorithm>
#include <functional>
#include <optional>
#include <chrono>
#include <unordered_map>
#include <sstream>
#include <cassert>
#include <math.h>
#include <nlohmann/json.hpp>
#include <random>
#include <list>
using json = nlohmann::json;
struct pairhash {
public:
  template <typename T, typename U>
  std::size_t operator()(const std::pair<T, U> &x) const
  {
    return std::hash<T>()(x.first) ^ std::hash<U>()(x.second);
  }
};

const std::chrono::seconds TIMELIMIT(600); // seconds