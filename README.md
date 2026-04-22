<!--
# Steven G. Opferman | steven.g.opferman@gmail.com
# Adapted from:
#   https://github.com/othneildrew/Best-README-Template/
#   https://github.com/kylelobo/The-Documentation-Compendium/
-->

<h1 align="center">dwdb</h1>
<div id="top"></div>

<p align="center">
  A structured database and REST API for Doctor Who episodes, stories, and spin-offs — designed to map cleanly to TVDB while supporting richer organization than TVDB allows.
  <br>
</p>

## Table of Contents

- [About](#about)
- [Usage](#usage)
- [Getting Started](#getting_started)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Acknowledgements](#acknowledgements)

## About <a name="about"></a>

TVDB (and by extension Plex, Sonarr, etc.) struggles with Doctor Who: specials land in awkward Season 0 buckets, multi-part stories have no first-class representation, and spin-offs have no cross-references to the parent show.

dwdb maintains a canonical episode database with its own organization logic, then provides a TVDB mapping layer so Plex-compatible tools can still look things up by TVDB ID.

### Data conventions

- **`doctor_id` on an episode** refers to the Doctor's incarnation at the *start* of the episode. Regeneration episodes belong to the outgoing Doctor — e.g. *The Tenth Planet* is a First Doctor episode, *End of Time* is a Tenth Doctor episode.
- **David Tennant** has two separate era entries: the Tenth Doctor (id=10) and the Fourteenth Doctor (id=14). They share an actor but are distinct story incarnations.
- **Stories belong to a single era.** For multi-Doctor stories, the broadcast year determines the era — e.g. *The Day of the Doctor* (2013) belongs to the Eleventh Doctor era.
- **Stories can belong to zero or more arcs** — e.g. *Parting of the Ways* is part of both the Bad Wolf arc and the Torchwood arc.

<p align="right">(<a href="#top">back to top</a>)</p>

## Usage <a name="usage"></a>

API docs are available at `http://localhost:3000/docs` when running locally.

<!-- _For more examples, please refer to the [Documentation](https://example.com)_ -->

<p align="right">(<a href="#top">back to top</a>)</p>

## Getting Started <a name="getting_started"></a>

These instructions will get you a copy of the project up and running.

### Prerequisites

- Node.js 20+
- Docker (for Postgres)

### Installation

1. Clone the repo

    ```sh
    git clone https://github.com/sopferman/dwdb.git
    cd dwdb
    ```

2. Install dependencies

    ```sh
    npm install
    ```

3. Copy the env file and adjust if needed

    ```sh
    cp .env.example .env
    ```

4. Start Postgres

    ```sh
    docker compose up -d
    ```

5. Run migrations

    ```sh
    npm run migrate:up
    ```

6. Start the dev server

    ```sh
    npm run dev
    ```

<p align="right">(<a href="#top">back to top</a>)</p>

## Roadmap <a name="roadmap"></a>

- [ ] Schema design
- [ ] Seed data
- [ ] REST API

<!--
See the [open issues](https://github.com/github_username/repo_name/issues) for a full list of proposed features (and known issues).
-->

<p align="right">(<a href="#top">back to top</a>)</p>

## Contributing <a name="contributing"></a>

Collaboration is what makes the world such an amazing place to learn, inspire, and create. **Any contributions or suggestions you make are greatly appreciated!**

Feel free to do any of the following:

- send me an [email](mailto:steven.g.opferman@gmail.com)
- [open an issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/creating-an-issue) with the tag "enhancement"
- [fork the repo](https://docs.github.com/en/get-started/quickstart/fork-a-repo) and [create a pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request)

<p align="right">(<a href="#top">back to top</a>)</p>

## Acknowledgements <a name="acknowledgements"></a>

- [TARDIS Data Core](https://tardis.fandom.com) — reference for episode metadata
- [TVDB](https://thetvdb.com) — mapping target

<p align="right">(<a href="#top">back to top</a>)</p>
