import Options, Utils

def configure(bld):
    pass

def test(bld):
    Utils.exec_command(['node', 't/test.js'])

def lint(bld):
    Utils.exec_command(['nodelint', 'mobileagent.js'])

