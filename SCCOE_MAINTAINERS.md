<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

# Santa Cruz COE fork maintenance

This public fork owns the small source patch stack and immutable application
image used by the SCCOE Superset service. Kubernetes configuration, secrets,
image promotion, metadata migrations, and production deployment belong in the
separate `SantaCruzCOE/superset-config` repository.

## Branch model

- `master` follows the upstream fork default and is not the SCCOE production
  release branch.
- `sccoe/6.1` is the maintained release line based on Apache Superset `6.1.0`
  commit `c83fb2bb1dcfac41ac51bcebd82471f4a7180d18`.
- Develop changes on focused branches and open pull requests against
  `sccoe/6.1`.
- Keep unavoidable SCCOE capabilities in isolated commits with focused tests.
  The current stack and upstream retirement criteria are in
  `SCCOE_PATCHES.md`.

Do not commit Superset runtime configuration, Kubernetes manifests, metadata
exports, credentials, or organization data to this repository.

## Feature workflow

1. Reproduce the desired behavior against the current `sccoe/6.1` branch.
2. Add or update focused tests in the same feature area.
3. Preserve an existing saved form-data key unless a separately reviewed
   metadata migration intentionally changes it.
4. Run the narrowest relevant local test while developing.
5. Open a pull request to `sccoe/6.1`; the SCCOE workflow runs the full ECharts
   suite, plugin build, frontend type/lint/translation checks, and complete
   `sccoe-lean` Linux image build.
6. Merge only when those checks pass. The resulting push workflow must also
   pass for the exact merge SHA before that SHA can be published.

The source workflow does not publish or deploy anything.

## Runtime dependencies

SCCOE-only direct dependencies are declared in
`requirements/sccoe-runtime.in` and compiled to
`requirements/sccoe-runtime.txt` against the upstream 6.1 base constraints for
Python 3.12 on Linux. Do not add runtime installation commands to entrypoints or
Kubernetes bootstrap scripts.

Use the compile command in `SCCOE_PATCHES.md`, review the entire lock diff, and
update the non-root image import smoke test when adding or removing an
integration. A connector change is not complete until the full hosted image
job passes.

## Publication and deployment

Publication begins in `SantaCruzCOE/superset-config`, not here:

1. Select the full 40-character SHA of a successful push run on `sccoe/6.1`.
2. Dispatch the configuration repository's manual SCCOE image publisher after
   its separate approval.
3. The publisher checks 6.1.0 ancestry, the successful exact-SHA push run, and
   the SHA-256 of this validation workflow before building.
4. Record and verify the immutable tag, registry digest, SPDX SBOM, and SLSA
   provenance.
5. Pin that tag plus digest in the configuration repository and validate the
   rendered release.
6. Production deployment requires another approval and the guarded manual
   workflow. It is never triggered by a fork push or pull request.

Changing `.github/workflows/sccoe-6-1-validation.yml` changes the trust boundary.
Review the workflow change, calculate its new SHA-256, and update
`FORK_VALIDATION_SHA256` in the configuration repository's publisher in the
same coordinated release. Until that configuration change is merged, the
publisher will deliberately reject new fork commits.

## Upstream maintenance

Do not merge upstream `master` into the production branch. For a planned
Superset base-version upgrade:

1. Create a new release branch from the exact reviewed upstream tag or commit.
2. Record whether the tag is signed and verify the source commit independently.
3. Reapply each SCCOE patch as a separate commit, retiring a patch only when
   upstream provides the same saved-data and rendering behavior.
4. Run the complete source and image gates.
5. Rehearse metadata migration and restore with the exact target image in the
   configuration repository before any production cutover.

Routine feature work on `sccoe/6.1` does not require rebasing the entire patch
stack onto a newer upstream branch.

## Release evidence and rollback

The configuration repository is the durable release ledger. Each promoted
image record must identify the fork SHA, configuration SHA, validation run,
tag, digest, SBOM, provenance, and deployment run. GitHub Actions artifacts are
supporting evidence but expire.

Source rollback alone is insufficient after a metadata migration. Follow the
configuration repository's migration and production-cutover runbooks and use
the exact retained image digest and compatible metadata snapshot.
