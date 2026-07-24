export default {
  globs: ["src/components/*.ts"],
  exclude: ["src/components/*.stories.ts"],
  outdir: ".",
  litelement: false,
  // ponytail: the shadow templates are string constants, so the analyzer would
  // otherwise publish `innerHTML` and every private helper as public API.
  plugins: [
    {
      name: "orc-drop-internals",
      packageLinkPhase({ customElementsManifest }) {
        for (const module of customElementsManifest.modules ?? []) {
          for (const declaration of module.declarations ?? []) {
            if (!declaration.members) continue;
            declaration.members = declaration.members.filter(
              (member) =>
                member.privacy !== "private" &&
                member.name !== "innerHTML" &&
                member.name !== "observedAttributes",
            );
          }
        }
      },
    },
  ],
};
