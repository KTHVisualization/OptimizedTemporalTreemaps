# Revised Tree structure

## tree.h
- Mainly taken from the previous tree structure
- Changes: 
    - Each node now has 2 values: `areaValue` and `scalarValue`.
    - Trees are given in the de-aggregated form.
    - Root nodes can have indices different from 0, not automatically 0 as before. This is to keep the consistency in the de-aggregated meaning of the tree.