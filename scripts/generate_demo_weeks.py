"""Generate fictional match weeks without rewriting the template's Excel features."""

from copy import copy
from pathlib import Path
import random
import re
from xml.etree import ElementTree
from xml.sax.saxutils import escape
from zipfile import ZipFile

ASSETS = Path(__file__).resolve().parents[1] / "public" / "assets" / "results"
SEED = 20261125
MATCHWEEK_XML = "xl/worksheets/sheet1.xml"
TEAMS_XML = "xl/worksheets/sheet2.xml"
NS = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def replace_cell(sheet, address, value):
    """Replace one cell's contents while preserving its style and surrounding XML."""
    cell_type = ' t="str"' if isinstance(value, str) else ""
    pattern = rf'(<x:c r="{address}" s="\d+")(?: t="str")?(?: />|><x:v>[^<]*</x:v></x:c>)'
    value = escape(str(value))
    sheet, count = re.subn(
        pattern, lambda match: f"{match[1]}{cell_type}><x:v>{value}</x:v></x:c>", sheet
    )
    if count != 1:
        raise ValueError(f"Expected one template cell at {address}")
    return sheet


def demo_rounds(teams):
    rng = random.Random(SEED)
    rng.shuffle(teams)
    rounds = []
    for week in range(10):
        matches = []
        for index in range(5):
            home, away = teams[index], teams[-1 - index]
            if week % 2:
                home, away = away, home
            matches.append((home, rng.randrange(6), rng.randrange(6), away))
        rounds.append(matches)
        teams.insert(1, teams.pop())
    scores = [(home, away) for week in rounds for _, home, away, _ in week]
    if (0, 0) not in scores or not any(home != away for home, away in scores):
        raise ValueError("The demo seed must produce a 0–0 draw and a win")
    return rounds


def main():
    with ZipFile(ASSETS / "GW_Template.xlsx") as template:
        teams_sheet = ElementTree.fromstring(template.read(TEAMS_XML))
        # Read only the first column of the supplied Teams worksheet.
        teams = [
            cell.findtext("x:v", namespaces=NS)
            for cell in teams_sheet.findall(".//x:c", NS)
            if re.fullmatch(r"A(?:[2-9]|[1-9]\d+)", cell.attrib["r"])
        ]
        if len(teams) != 10 or len(set(teams)) != 10 or not all(teams):
            raise ValueError("The Teams sheet must list ten distinct teams")
        original = template.read(MATCHWEEK_XML).decode("utf-8")
        for week, matches in enumerate(demo_rounds(teams), 1):
            sheet = replace_cell(original, "B2", f"GW{week}")
            for row, match in enumerate(matches, 6):
                for column, value in zip("BCDE", match, strict=True):
                    sheet = replace_cell(sheet, f"{column}{row}", value)
            with ZipFile(ASSETS / f"GW{week}.xlsx", "w") as output:
                for entry in template.infolist():
                    data = sheet.encode("utf-8") if entry.filename == MATCHWEEK_XML else template.read(entry)
                    output.writestr(copy(entry), data)


if __name__ == "__main__":
    main()
