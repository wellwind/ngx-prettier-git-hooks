import { afterPrepareCommands } from './../consts';
import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

function cleanUpCommands(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.info('Clean up commands');

    const content = JSON.parse(tree.read('package.json')!.toString('UTF-8'));

    // 將套件完成後執行的指令清除
    content.scripts['prepare'] = (content.scripts['prepare'] as string).replace(` && ${afterPrepareCommands}`, '');

    tree.overwrite('package.json', JSON.stringify(content, null, 2));
    return tree;
  };
}

export function afterNgAdd(_options: any): Rule {
  return chain([cleanUpCommands()]);
}
