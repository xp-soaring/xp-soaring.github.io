#!/bin/bash

rm -r ../xp-soaring.github.io/tasks/b21_task_planner/
rsync -a --exclude=".git*" . ../xp-soaring.github.io/tasks/b21_task_planner
