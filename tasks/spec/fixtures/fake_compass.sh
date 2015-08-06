#! /bin/sh

echo "Fake compass called with $@"

mkdir -p css
here="$( cd .. ; pwd )"
cp scss/*.scss "css/$( basename $here ).css"
