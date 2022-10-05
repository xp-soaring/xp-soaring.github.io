#!/bin/bash

rm -r ../xp-soaring.github.io/tasks/b21_task_planner/
rsync -a --exclude=".git*" --exclude="copy_to_xp-soaring.sh" . ../xp-soaring.github.io/tasks/b21_task_planner
