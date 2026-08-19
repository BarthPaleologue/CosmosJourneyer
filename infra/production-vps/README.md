# Production infrastructure

This directory contains the declarative configuration for the production VPS. Application artifacts are built and
deployed separately by GitHub Actions.

## SSH hardening

The production inventory uses the `ubuntu` administrative account and the SSH host key already recorded by the
operator. No private key or password belongs in this directory.

Keep an existing SSH session open during the first application. From this directory, first preview the change:

```sh
ansible-playbook site.yml --check --diff
```

Then apply it:

```sh
ansible-playbook site.yml --diff
```

The playbook refuses to disable password authentication unless the administrative account has a non-empty
`authorized_keys` file. It validates the candidate and complete SSH configurations before reloading the service, then
opens a fresh connection to confirm that public-key access still works.

The managed file is intentionally named `/etc/ssh/sshd_config.d/00-cosmos-journeyer-hardening.conf`. OpenSSH uses the
first value encountered for most settings, while cloud-init currently enables password authentication in
`50-cloud-init.conf`.

If access fails despite the preflight checks, use the provider console, move the managed file out of
`/etc/ssh/sshd_config.d`, validate with `sshd -t`, and reload the `ssh` service.
