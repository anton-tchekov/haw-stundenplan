var courses =
[
	[ "OE", "Orientierungseinheit " ],
	[ "PT", "Programmiertechnik " ],
	[ "PM", "Programmiermethodik " ],
	[ "DM", "Diskrete Mathematik " ],
	[ "MS", "Mess- und Sensortechnik " ],
	[ "GT", "Grundlagen der Technischen Informatik " ]
];

var profs =
[
	[ "BRN", "Prof. Dr. Reinhard Baran" ],
	[ "PDB", "Prof. Dr. Julia Padberg" ]
];

var colors =
[
	"rgba(0, 255, 0, 0.2)",
	"rgba(255, 0, 0, 0.2)",
	"rgba(0, 0, 255, 0.2)",
	"rgba(255, 255, 0, 0.2)",
	"rgba(0, 255, 255, 0.2)",
	"rgba(255, 0, 255, 0.2)"
];

const INPUT_FILE = "semester1.json";

function readfile(url, callback)
{
	var file = new XMLHttpRequest();
	file.overrideMimeType("application/json");
	file.open("GET", url);
	file.onreadystatechange = function()
	{
		if(file.readyState === 4 && file.status == 200)
		{
			callback(file.responseText);
		}
	}

	file.send();
}

Date.prototype.getWeekNumber = function()
{
	var d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
	var dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

readfile(INPUT_FILE, function(content)
{
	var data = JSON.parse(content);
	console.log(data);

	var min_week = 1000, max_week = 0;

	data.weekdays.forEach(wd =>
		wd.forEach(event => {
			var ranges = event.weeks.split(",");
			var all = [];
			ranges.forEach(range => {
				var values = range.split("-");
				var v1, v2;
				if(values.length == 1)
				{
					v1 = v2 = parseInt(values);
				}
				else
				{
					v1 = parseInt(values[0]);
					v2 = parseInt(values[1]);
				}

				max_week = Math.max(v1, max_week);
				max_week = Math.max(v2, max_week);
				min_week = Math.min(v1, min_week);
				min_week = Math.min(v2, min_week);

				all.push([ v1, v2 ]);
			});

			event.weeks = all;

			event.name = event.name.replace("BITS1-", "");

			var flag = true;

			event.full_name = event.name;

			while(flag)
			{
				flag = false;
				courses.forEach(course =>
				{
					function replace_range(s, start, end, subst)
					{
						return s.substring(0, start) + subst + s.substring(end);
					}

					var idx = event.full_name.indexOf(course[0]);
					if(idx == -1)
					{
						return;
					}

					flag = true;

					var repl = course[1];
					var len = course[0].length;

					switch(event.full_name[idx + len])
					{
						case "P":
							++len;
							repl += " Praktikum ";
							break;

						case "Ü":
							++len;
							repl += " Übung ";
							break;
					}

					event.full_name = replace_range(event.full_name, idx, idx + len, repl);
				});
			}

			event.full_name = event.full_name.replace("/", " / ");
			event.full_name = event.full_name.trim();
			event.full_name = event.full_name.replace(/ +(?= )/g,'');

			event.prof_name = "";
			profs.forEach(prof => {
				if(prof[0] == event.prof)
				{
					event.prof_name = prof[1];
				}
			});
		})
	);

	console.log("Max Week " + max_week);
	console.log("Min Week " + min_week);

	var weeks = [];
	for(i = min_week; i <= max_week; ++i)
	{
		var week =
		{
			number: i,
			start: "",
			end: "",
			wd: [ [], [], [], [], [] ]
		};

		for(j = 0; j < 5; ++j)
		{
			data.weekdays[j].forEach(event =>
			{
				event.weeks.forEach(range =>
				{
					if(i >= range[0] && i <= range[1])
					{
						week.wd[j].push(event);
					}
				});
			});
		};

		weeks.push(week);
	}

	console.log(data);

	console.log(weeks);

	var today = new Date();

	var days = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

	document.getElementById("info").innerHTML = "Stand vom " + data.date + ", Version: " + data.version + "<br>" +
		"Aktuelle Kalenderwoche: " + today.getWeekNumber() + " (" + days[today.getDay()] + ")<br><br>" +
		"Quelle: <a href=\"" + data.source + "\">" + data.source + "</a><br>" +
		"JSON: <a href=\"" + INPUT_FILE + "\">" + INPUT_FILE + "</a><br>" +
		"Source Code: <a href=\"#\">GitHub Repo</a>";

	var output = document.getElementById("output");

	for(i = 0; i < weeks.length; ++i)
	{
		output.innerHTML += "<h2 class=\"closed\" data-tag=\"" + i + "\">" + weeks[i].number + ". Woche</h2>";

		table = "<table style=\"display: none;\" data-tag=\"" + i + "\"><tr>";

		for(j = 0; j < 5; ++j)
		{
			table += "<td>" + days[j + 1] + "</td>";
		}

		table += "</tr><tr>";

		for(j = 0; j < 5; ++j)
		{
			table += "<td>";

			weeks[i].wd[j].forEach(event =>
			{
				var style = "";
				for(k = 0; k < 6; ++k)
				{
					if(event.full_name.indexOf("0" + (k + 1)) != -1)
					{
						style = " style=\"background-color: " + colors[k] + "\"";
					}
				}

				table += "<div" + style + ">" +
					"<p><strong>Was:</strong> " + event.name + (event.full_name == "" ? "" : (" (" + event.full_name + ")")) + "</p>" +
					"<p><strong>Wo:</strong> " + event.location + "</p>" +
					"<p><strong>Wann:</strong> " + event.start + " - " + event.end + "</p>" +
					"<p><strong>Wer:</strong> " + event.prof + (event.prof_name == "" ? "" : (" (" + event.prof_name + ")")) + "</p>" +
					"<p><strong>Wie:</strong> " + event.type + "</p></div>";
			});

			table += "</td>";
		}

		table += "</tr></table>";

		output.innerHTML += table;
	}

	var elements = document.getElementsByTagName("h2");
	for(let elem of elements)
	{
		elem.onclick = function(event)
		{
			var table = document.querySelector("table[data-tag=\"" + event.target.dataset.tag + "\"]");
			if(table.style.display == "block")
			{
				table.style.display = "none";

				elem.classList.add("closed");
				elem.classList.remove("open");
			}
			else
			{


				table.style.display = "block";
				elem.classList.add("open");
				elem.classList.remove("closed");

			}
		}
	}

});



