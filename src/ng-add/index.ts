import { chain, Rule , SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { afterPrepareCommands } from '../consts';
import { prettierignoreContent } from './templates/prettierignore';

function createFileIfNotExist(tree: Tree, fileName: string, content: string) {
  if (!tree.exists(fileName)) {
    tree.create(fileName, content);
  }
}

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

function addPrettierIgnore(): Rule {
  return (tree: Tree) => {
    const fileName = '.prettierignore';
    let content = '';

    if (tree.exists(fileName)) {
      content = tree.read(fileName)!.toString('UTF-8') + '\n' + prettierignoreContent;
      tree.overwrite(fileName, content);
    } else {
      tree.create(fileName, prettierignoreContent);
    }

    return tree;
  };
}

function addPrettierRcJson(): Rule {
  return (tree: Tree) => {
    const fileName = '.prettierrc.json';
    createFileIfNotExist(tree, fileName, '{}');

    const content = JSON.parse(tree.read(fileName)!.toString('UTF-8'));

    content['tabWidth'] = 2;
    content['useTabs'] = false;
    content['printWidth'] = 100;
    content['bracketSpacing'] = true;
    content['singleQuote'] = true;
    content['trailingComma'] = 'es5';
    content['semi'] = true;

    if (!content['overrides']) {
      content['overrides'] = [];
    }

    const overridesSettings = [
      {
        files: ['*.json', '.babelrc'],
        options: {
          parser: 'json-stringify',
        },
      },
      {
        files: ['*.jsonc', 'tsconfig*.json'],
        options: {
          parser: 'json',
        },
      },
      {
        files: ['*.js', '*.cjs', '*.mjs'],
        options: {
          parser: 'babel',
        },
      },
      {
        files: ['*.ts'],
        options: {
          parser: 'typescript',
        },
      },
    ];

    overridesSettings.forEach((item) => {
      content['overrides'].push(item);
    });

    tree.overwrite(fileName, JSON.stringify(content, null, 2));

    return tree;
  };
}

function addVSCodeSettingsJson(): Rule {
  return (tree: Tree) => {
    const fileName = '.vscode/settings.json';
    createFileIfNotExist(tree, fileName, '{}');

    const content = JSON.parse(tree.read(fileName)!.toString('UTF-8'));
    content['[typescript]'] = { 'editor.defaultFormatter': 'esbenp.prettier-vscode' };
    content['[javascript]'] = { 'editor.defaultFormatter': 'esbenp.prettier-vscode' };
    content['[html]'] = { 'editor.defaultFormatter': 'esbenp.prettier-vscode' };
    content['[json]'] = { 'editor.defaultFormatter': 'esbenp.prettier-vscode' };
    content['[jsonc]'] = { 'editor.defaultFormatter': 'esbenp.prettier-vscode' };
    content['editor.formatOnSave'] = true;

    tree.overwrite(fileName, JSON.stringify(content, null, 2));

    return tree;
  };
}

function addVSCodeExtensionsJson(): Rule {
  return (tree: Tree) => {
    const fileName = '.vscode/extensions.json';
    createFileIfNotExist(tree, fileName, '{}');

    const content = JSON.parse(tree.read(fileName)!.toString('UTF-8'));
    const recommendationsKey = 'recommendations';
    if (!content[recommendationsKey]) {
      content[recommendationsKey] = [];
    }

    const recommendations = ['EditorConfig.EditorConfig', 'esbenp.prettier-vscode'];
    recommendations.forEach((item) => {
      const found = (content[recommendationsKey] as string[]).find((recommend) => recommend === item);
      if (!found) {
        content[recommendationsKey].push(item);
      }
    });

    tree.overwrite(fileName, JSON.stringify(content, null, 2));

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
  return chain([
    addPackages(),
    setPrepareScript(),
    addPrettierIgnore(),
    addPrettierRcJson(),
    addVSCodeSettingsJson(),
    addVSCodeExtensionsJson(),
    installPackages()
  ]);
}
