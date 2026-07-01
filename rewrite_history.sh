#!/bin/sh

# Replace these with your actual GitHub name and email
CORRECT_NAME="dharshana-sn"
CORRECT_EMAIL="dharshanans54@gmail.com"

git filter-branch --env-filter '
if [ "$GIT_AUTHOR_NAME" = "claude" ] || [ "$GIT_AUTHOR_NAME" = "Claude" ]; then
    export GIT_AUTHOR_NAME="'"$CORRECT_NAME"'"
    export GIT_AUTHOR_EMAIL="'"$CORRECT_EMAIL"'"
    export GIT_COMMITTER_NAME="'"$CORRECT_NAME"'"
    export GIT_COMMITTER_EMAIL="'"$CORRECT_EMAIL"'"
fi
' --tag-name-filter cat -- --branches --tags

echo "History rewritten!"
echo "Now run: git push origin --force --all"
