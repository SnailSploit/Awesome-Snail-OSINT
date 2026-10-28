from pathlib import Path
import re
import subprocess

MAIN = '22ca4ba3c6b37efd2e3fea2e965dca58a6c14228'
SOURCE = '26aa3615445104c9e7594a2bdf36c07ec6f388e6'
def show(ref, path):
    return subprocess.check_output(['git', 'show', ref + ':' + path], text=True)

# Preserve the main landing page and exact category headings consumed by Atlas.
readme = show(MAIN, 'README.md')
marker = '## Start here\n'
assert readme.count(marker) == 1
intro = '''## The investigation atlas

The interactive interface, source catalog, investigation chains, fieldcraft notes,
and local caseboard all live in this repository on **main**.

**[Atlas interface and setup](ATLAS.md)** \u00b7 **[Search guide](SEARCH_GUIDE.md)** \u00b7 **[Evidence-first field guide](docs/field-guide.md)**

```bash
python3 scripts/build_atlas.py
python3 -m http.server 8080 --directory _site
```

Open `http://localhost:8080` after building. Publication is separate from the repository merge;
see [ATLAS.md](ATLAS.md) for the existing manual deployment workflow.

'''
readme = readme.replace(marker, intro + marker, 1)
training = '## Training and Learning\n'
assert readme.count(training) == 1
readme = readme.replace(training, training + '\n- [Trace Labs](https://www.tracelabs.org/) - Community OSINT training and challenges; legacy listing, availability not reverified.\n- [GeoGuessr](https://www.geoguessr.com/) - Geolocation practice; legacy listing, access terms not reverified.\n', 1)
Path('README.md').write_text(readme)

guide = show(SOURCE, 'SEARCH_GUIDE.md')
guide = guide.replace('> **Master the art of finding anything, anywhere on the internet**', '> **Legacy search reference consolidated into the main repository.**\n> Query syntax and service availability have not been revalidated. Use the [evidence-first field guide](docs/field-guide.md), obtain authorization for active testing, and do not treat a lookup as proof of identity or ownership. Unsupported success-rate and time-saving estimates have been removed.')
guide = guide.replace('README.md#-search-engine-dorks', 'README.md#search-engine-dorks').replace('README.md#-osint-tools--dashboards', 'README.md#osint-tools--dashboards')
guide = re.sub(r'\*\*Success Rate:\*\*[^\n]*\n', '', guide)
start = guide.index('| Technique | Description | Time Saved |')
end = guide.index('\n### Common Pitfalls', start)
guide = guide[:start] + '''| Technique | Use |
| --- | --- |
| Browser extensions | Reduce repetitive image and video checks |
| Automation scripts | Batch authorized searches; verify output independently |
| Saved searches | Revisit a documented query over time |
| Bookmark organization | Keep sources grouped by investigative question |

No measured time-saving claim is made for these suggestions.
''' + guide[end:]
start = guide.index('## \U0001f4ca Search Effectiveness Matrix')
end = guide.index('\n---', start)
guide = guide[:start] + '''## Assessment limits

Search success depends on source coverage, currency, access restrictions, and the
quality of corroboration. This guide does not provide measured success rates or
completion-time estimates. Shared usernames, area codes, IP addresses, and matching
photos are leads, not conclusive attribution to a person.
''' + guide[end:]
guide = guide.replace('**Always verify across 3+ sources:**', '**Evaluate source independence, currency, and contradictory evidence:**')
guide = guide.replace('\u2705 If 3+ sources confirm \u2192 Likely accurate\n\u274c If only 1-2 sources \u2192 Needs more verification', 'Multiple copies of one upstream claim are not independent corroboration.\nRecord alternative explanations and unresolved uncertainty.')
Path('SEARCH_GUIDE.md').write_text(guide)

# Do not leave one-time repository mutation machinery in the final product.
Path('.github/workflows/consolidation-audit.yml').unlink(missing_ok=True)
Path('scripts/reconcile_main_once.py').unlink(missing_ok=True)

urls = lambda text: set(re.findall(r'\]\((https?://[^)\s]+)', text))
assert urls(show(MAIN, 'README.md')) <= urls(readme)
assert all(not re.search(r'^(<<<<<<< |=======\s*$|>>>>>>> )', p.read_text(), re.M)
           for p in [Path('README.md'), Path('SEARCH_GUIDE.md')])
print('Resolved README using main layout; retained unique guide and training references.')
