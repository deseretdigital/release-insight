var Story = function(data){
    this.data = data;
    this.preload = false;
};

Story.prototype.getId = function(){
    return this.data.id;
};

module.exports = Story;