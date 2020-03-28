base="https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_"

for condition in confirmed deaths recovered
do
	url=$base$condition"_global.csv"
	file="./time_series_covid19_"$condition"_global.csv"
	echo "Downloading "$condition" to "$file
	curl $url > $file
done
