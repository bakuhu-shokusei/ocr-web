source="/root/ocr-assets/"
target="/root/backup/ocr-assets"

rsync -au --delete --exclude "*.png" --exclude "*.jpeg" --exclude "*.jpg" --exclude ".git" "$source" "$target"


echo "formatting json file"

cd "$target"

IFS=$'\n'
for file in `find . -name "*.json" -type f`; do
  jq . < "$file" > "$file.out" && mv "$file.out" "$file"
done

if [[ `git status --porcelain` ]]; then
  # Changes
  git add .
  git commit -m 'update by cron job'
  git push
else
  # No changes
  echo "No changes!"
fi
