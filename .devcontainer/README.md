# Dev container

Edit `devenv.yaml`, then run `mise exec -- devenv generate` to regenerate
`shared/devcontainer.json`. Open that shared configuration in your container-capable
editor. Personal `user/` overrides are ignored by Git.

The configuration supplies mise, Copilot and `gh`. `.tool-versions` pins the generator
and local checker runtime. Supplied skill packages own their additional tool pins.
Record actual environment versions before execution.
