#!/bin/bash
Green='\033[1;32m' # Green
NC='\033[0m' # No Color

echo
echo Generating \".yaml\" files from the \".yaml.template\" files.
echo

for yaml_template in $(find ../ -name "*.yaml.template" -type f); do
    echo "Processing \"$yaml_template\"..."
    
    for env_variable in $(cat "$yaml_template" | grep -o '\{[^}]*\}' ); do
        echo var: \"$env_variable\" replaced.
    done
    
    
    yaml_file=${yaml_template//.template/}
    envsubst < "$yaml_template" > "$yaml_file"
    echo -e "${Green}Generated \"$yaml_file\".${NC}"
    echo
done