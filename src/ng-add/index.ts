import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { afterPrepareCommands } from '../consts';

function addPackages(): Rule {
  return (tree: Tree) => {
    const content = JSON.parse(tree.read('package.json')!.toString('UTF-8'));
    content.devDependencies['husky'] = '^7.0.2';
    content.devDependencies['prettier'] = '^2.3.2';
    content.devDependencies['pretty-quick'] = '^3.1.1';
    tree.overwrite('package.json', JSON.stringify(content, null, 2));
    return tree;
  };
}

function setPrepareScript(): Rule {
  return (tree: Tree) => {
    const huskyInstallCommand = 'husky install';
    const content = JSON.parse(tree.read('package.json')!.toString('UTF-8'));

    // 如果本來有設定 prepare，責附加到後面
    const prepareScript = content.scripts['prepare'];
    if (prepareScript) {
      content.scripts['prepare'] = `${prepareScript} && ${huskyInstallCommand}`;
    } else {
      content.scripts['prepare'] = huskyInstallCommand;
    }

    // 加上套件安裝完成後的指令
    content.scripts['prepare'] = `${content.scripts['prepare']} && ${afterPrepareCommands}`;

    tree.overwrite('package.json', JSON.stringify(content, null, 2));
    return tree;
  };
}

function installPackages(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.addTask(new NodePackageInstallTask());
    return tree;
  };
}

export function ngAdd(_options: any): Rule {
  return chain([addPackages(), setPrepareScript(), installPackages()]);
}
