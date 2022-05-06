#!/bin/bash
Green='\033[1;32m' # Green
NC='\033[0m' # No Color

for yaml_template in $(find ../ -name "*.yaml.template" -type f); do
    echo "Processing \"$yaml_template\"..."
    yaml_file=${yaml_template//.template/}
    envsubst < "$yaml_template" > "$yaml_file"
    echo -e "${Green}Generated \"$yaml_file\".${NC}"
done